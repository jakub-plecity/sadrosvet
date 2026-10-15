import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';

const postgres = new PGlite();
const files = new Map();
const state = globalThis.__netlifyTest = {cookie: '', files, sent: []};
state.pool = {
  async query(sql, values = []) {
    const r = await postgres.query(sql, values);
    return {rows: r.rows, rowCount: r.affectedRows ?? r.rows.length};
  },
  async connect() {return {...this, release() {}};}
};
for (const migration of (await readdir('netlify/database/migrations')).sort()) {
  await postgres.exec(await readFile('netlify/database/migrations/' + migration, 'utf8'));
}
process.env.LOCAL_ADMIN_USERNAME = 'test-admin';
process.env.LOCAL_ADMIN_PASSWORD = randomUUID();
process.env.ADMIN_SESSION_SECRET = randomUUID() + randomUUID();
process.env.ORDER_EMAIL_FROM = 'SádroSvět <objednavky@sadrosvet.cz>';
process.env.RESEND_API_KEY = 'test-only';
process.env.SITE_ORIGIN = 'https://shop.example.test';
const output = await build({
  stdin: {contents: `
    export * as catalog from './lib/server';
    export * as login from './app/api/admin/login/route';
    export * as logout from './app/api/admin/logout/route';
    export * as products from './app/api/products/route';
    export * as product from './app/api/products/[id]/route';
    export * as photos from './app/api/photos/route';
    export * as upload from './app/api/upload/route';
    export * as images from './app/api/images/[key]/route';
    export * as orders from './app/api/orders/route';
    export * as contact from './app/api/contact/route';
    export * as email from './app/api/admin/email/route';
    export * as session from './lib/admin-session';
    export {Database} from './lib/database';
  `, resolveDir: process.cwd()},
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{name: 'netlify-platform-fixture', setup(b) {
    b.onResolve({filter: /^(server-only|next\/headers|@netlify\/database|@netlify\/blobs)$/}, a => ({path: a.path, namespace: 'fixture'}));
    b.onLoad({filter: /.*/, namespace: 'fixture'}, a => ({loader: 'js', contents:
      a.path === 'server-only' ? '' :
      a.path === 'next/headers' ? `export async function cookies(){return {get:()=>globalThis.__netlifyTest.cookie?{value:globalThis.__netlifyTest.cookie}:undefined};}` :
      a.path === '@netlify/database' ? `export const getDatabase=()=>({pool:globalThis.__netlifyTest.pool});` :
      `export function getStore(){const files=globalThis.__netlifyTest.files;return {
        async set(key,data,options){files.set(key,{data,metadata:options.metadata});},
        async getWithMetadata(key){return files.get(key)||null;},async delete(key){files.delete(key);}
      };}`
    }));
  }}]
});
const app = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));
const origin = 'https://shop.example.test';
function request(path, body, extra = {}) {
  return new Request(origin + path, {method: 'POST', headers: {origin, 'content-type': 'application/json', 'x-nf-client-connection-ip': '192.0.2.1', ...extra}, body: JSON.stringify(body)});
}
async function signedIn() {state.cookie = (await app.session.createSession()).split(';')[0].split('=').slice(1).join('=');}
after(async () => {await postgres.close();});

test('Postgres migrations preserve the current 21 products, gallery order, categories and photo records', async () => {
  const products = await app.catalog.readProducts();
  assert.equal(products.length, 21);
  assert.equal(products.find(p => p.name === 'Vánoční ozdoby').images.length, 3);
  assert.ok((await app.catalog.readCategories()).includes('test kategorie'));
  await signedIn();
  const response = await app.photos.GET();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).photos.length, 3);
});

test('transactions roll back all preceding writes after a constraint violation', async () => {
  const db = new app.Database(state.pool);
  await assert.rejects(() => db.batch([
    db.prepare('INSERT INTO settings (key,value) VALUES ($1,$2)').bind('rollback-test','first'),
    db.prepare('INSERT INTO settings (key,value) VALUES ($1,$2)').bind('rollback-test','duplicate')
  ]));
  assert.equal(await db.prepare('SELECT * FROM settings WHERE key=$1').bind('rollback-test').first(), null);
});

test('admin requires a signed session; spoofed old hosting identity headers grant no access', async () => {
  state.cookie = '';
  assert.equal(await app.catalog.isAdmin(), false);
  const response = await app.products.GET(new Request(origin + '/api/products?all=1', {headers: {'oai-authenticated-user-email':'owner@example.test','oai-authenticated-user-id':'owner'}}));
  assert.equal(response.status, 403);
  await signedIn(); assert.equal(await app.catalog.isAdmin(), true);
  state.cookie += 'tampered'; assert.equal(await app.catalog.isAdmin(), false);
});

test('login enforces origin, password, HttpOnly secure cookies, logout and persistent rate limits on Netlify client IP', async () => {
  const credentials = {username: process.env.LOCAL_ADMIN_USERNAME, password: process.env.LOCAL_ADMIN_PASSWORD};
  assert.equal((await app.login.POST(request('/api/admin/login', credentials, {origin:'https://evil.example.test'}))).status, 403);
  assert.equal((await app.login.POST(request('/api/admin/login', {...credentials,password:'wrong'}))).status, 401);
  const response = await app.login.POST(request('/api/admin/login', credentials));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Strict/);
  assert.equal((await app.logout.POST(request('/api/admin/logout', {}))).status, 200);
  for(let i=0; i<10; i++) assert.equal((await app.login.POST(request('/api/admin/login', {...credentials,password:'wrong'}))).status,401);
  assert.equal((await app.login.POST(request('/api/admin/login', credentials))).status,429);
});

test('product editing retains PostgreSQL optimistic concurrency and rejects cross-origin writes', async () => {
  await signedIn();
  const p = {name:'Test výrobku',description:'Popis',category:'Vázy',priceMinor:10000,stock:3,image:'/collection.png',images:['/collection.png'],status:'draft',sample:0};
  assert.equal((await app.products.POST(request('/api/products',p,{origin:'https://evil.example.test'}))).status,403);
  const response = await app.products.POST(request('/api/products',p)); assert.equal(response.status,201);
  const {id} = await response.json();
  const params = {params:Promise.resolve({id})};
  assert.equal((await app.product.PUT(request('/api/products/'+id,{...p,revision:1}),params)).status,200);
  assert.equal((await app.product.PUT(request('/api/products/'+id,{...p,revision:1}),params)).status,409);
  assert.equal((await app.product.DELETE(request('/api/products/'+id,{revision:2,permanent:true}),params)).status,200);
});

test('multipart photo upload persists bytes and metadata; migrated photo URLs resolve without the old host', async () => {
  await signedIn();
  const form = new FormData();
  form.append('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=','base64')],'test.png',{type:'image/png'}));
  const response = await app.upload.POST(new Request(origin+'/api/upload',{method:'POST',headers:{origin},body:form}));
  assert.equal(response.status,200); const {image} = await response.json();
  const key=image.split('/').pop(); assert.equal(files.get(key).metadata.contentType,'image/png');
  const served=await app.images.GET(new Request(origin+image),{params:Promise.resolve({key})});
  assert.equal(served.status,200);assert.equal(served.headers.get('content-type'),'image/png');
  const imported=await app.images.GET(new Request(origin+'/api/images/3039ba8c-f8b3-4fe2-89ec-ff89cb5e91cf'),{params:Promise.resolve({key:'3039ba8c-f8b3-4fe2-89ec-ff89cb5e91cf'})});
  assert.equal(imported.status,302);assert.equal(new URL(imported.headers.get('location')).origin,origin);
});

test('checkout remains explicitly demo-only, price checked, idempotent and rejects DPD and real customer fields', async () => {
  const p={id:randomUUID(),items:[{id:'sample-vase',quantity:1}],delivery:{service:'personal-pickup',payment:'cash',point:null},expectedTotalMinor:29000};
  assert.equal((await app.orders.POST(request('/api/orders',p))).status,201);
  const retry=await app.orders.POST(request('/api/orders',p));assert.equal(retry.status,200);assert.equal((await retry.json()).demo,true);
  assert.equal((await app.orders.POST(request('/api/orders',{...p,delivery:{service:'dpd-address',payment:'cod',point:null}}))).status,400);
  assert.equal((await app.orders.POST(request('/api/orders',{...p,customer:{email:'person@example.test'}}))).status,400);
  assert.equal((await app.orders.POST(request('/api/orders',{...p,id:randomUUID(),expectedTotalMinor:1}))).status,409);
});

test('contact form and admin email use Resend server settings and fixed recipient; no mail is sent in tests', async () => {
  const savedFetch=globalThis.fetch;
  globalThis.fetch=async (url,options) => {assert.equal(url,'https://api.resend.com/emails');state.sent.push(JSON.parse(options.body));return Response.json({id:'mock-resend-id'});};
  try {
    const r=await app.contact.POST(request('/api/contact',{id:randomUUID(),name:'Test návštěvníka',email:'visitor@example.test',_subject:'Dotaz k výrobku',message:'Prosím o informace k váze.',website:''}));
    assert.equal(r.status,200);
    assert.deepEqual(state.sent[0].to,['sadrosvet@seznam.cz']);
    assert.equal(state.sent[0].from,'SádroSvět <objednavky@sadrosvet.cz>');
    assert.equal(state.sent[0].reply_to,'visitor@example.test');
    await signedIn();
    assert.equal((await app.email.POST(request('/api/admin/email',{}))).status,200);
    assert.equal((await app.email.POST(request('/api/admin/email',{}))).status,429);
  } finally {globalThis.fetch=savedFetch;}
});
