import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {copyToSupabase, savePrivateBackup} from '../scripts/supabase-copy.mjs';

function adapter(db) {
 return {async query(sql, values) {
  if (values) return db.query(sql, values);
  const results=await db.exec(sql);
  return results.at(-1) || {rows: []};
 }};
}
async function fixtures() {
 const source=new PGlite(),target=new PGlite();
 for(const name of (await readdir('netlify/database/migrations')).sort()) await source.exec(await readFile('netlify/database/migrations/'+name,'utf8'));
 await target.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await source.query("UPDATE products SET name=$1,stock=7 WHERE id=(SELECT id FROM products ORDER BY id LIMIT 1)", ['Žluťoučký nový výrobek']);
 await source.exec(`INSERT INTO customer_orders(id,order_number,payment_method,service,customer_name,customer_email,customer_phone,subtotal_minor,shipping_minor,cod_minor,total_minor,request_hash)
 OVERRIDING SYSTEM VALUE VALUES('migrate-order',42,'cash','personal-pickup','Test','test@example.test','123',100,0,0,100,'testhash');
 SELECT setval(pg_get_serial_sequence('customer_orders','order_number'),99,true);`);
 return {source,target,from:adapter(source),to:adapter(target),async close(){await source.close();await target.close();}};
}

test('migration verifies current source values, preserves identities, and protects Data API access', async()=>{
 const f=await fixtures();
 try {
  const result=await copyToSupabase(f.from,f.to,{apply:true,saveBackup:async snapshot=>{assert.equal(snapshot.format,1);assert.ok(snapshot.tables.products.length);await savePrivateBackup(f.to,snapshot);}});
  assert.equal(result.applied,true);
  assert.equal((await f.target.query('SELECT count(*)::int AS n FROM sadrosvet_backups.exports')).rows[0].n,1);
  assert.equal((await f.target.query("SELECT has_schema_privilege('anon','sadrosvet_backups','usage') AS allowed")).rows[0].allowed,false);
  assert.ok(result.tables.every(t=>t.verified));
  assert.equal((await f.target.query("SELECT name FROM products WHERE stock=7 AND name LIKE 'Žluť%'")).rows[0].name,'Žluťoučký nový výrobek');
  assert.equal((await f.target.query("SELECT order_number::text AS n FROM customer_orders WHERE id='migrate-order'")).rows[0].n,'42');
  assert.equal((await f.target.query("SELECT nextval(pg_get_serial_sequence('customer_orders','order_number'))::text AS n")).rows[0].n,'100');
  assert.equal((await f.target.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")).rows[0].n,0);
  assert.equal((await f.target.query("SELECT has_table_privilege('anon','customer_orders','select') AS allowed")).rows[0].allowed,false);
  assert.equal((await f.target.query('SELECT count(*)::int AS n FROM sadrosvet_schema_migrations')).rows[0].n,(await readdir('netlify/database/migrations')).length);
  assert.equal((await f.source.query("SELECT count(*)::int AS n FROM customer_orders WHERE id='migrate-order'")).rows[0].n,1);
 } finally {await f.close();}
});

test('migration check exercises copy but leaves target empty',async()=>{
 const f=await fixtures();
 try {
  const result=await copyToSupabase(f.from,f.to);
  assert.equal(result.applied,false);
  assert.equal((await f.target.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n,0);
 } finally {await f.close();}
});

test('migration refuses an occupied target without changing its contents',async()=>{
 const f=await fixtures();
 try {
  await f.target.exec("CREATE TABLE keep_me(id int); INSERT INTO keep_me VALUES(123);");
  await assert.rejects(()=>copyToSupabase(f.from,f.to,{apply:true,saveBackup:async snapshot=>{assert.equal(snapshot.format,1);assert.ok(snapshot.tables.products.length);await savePrivateBackup(f.to,snapshot);}}),/not empty/);
  assert.equal((await f.target.query('SELECT id FROM keep_me')).rows[0].id,123);
 } finally {await f.close();}
});

test('copy failure rolls back schema and rows',async()=>{
 const f=await fixtures();
 try {
  const failing={async query(sql,values){if(sql.startsWith('INSERT INTO public."products"'))throw new Error('simulated connection failure');return f.to.query(sql,values);}};
  await assert.rejects(()=>copyToSupabase(f.from,failing,{apply:true,saveBackup:async snapshot=>{assert.equal(snapshot.format,1);assert.ok(snapshot.tables.products.length);await savePrivateBackup(f.to,snapshot);}}),/simulated/);
  assert.equal((await f.target.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n,0);
 } finally {await f.close();}
});

test('provider requires explicit switch, reuses a small TLS pool, and never falls back', async()=>{
 const output=await build({entryPoints:['lib/database-pool.mjs'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'drivers',setup(b){
  b.onResolve({filter:/^(@netlify\/database|pg)$/},a=>({path:a.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='pg'?`export default {Pool:class {constructor(options){this.options=options;} on(){}}};`:`export const getDatabase=()=>({pool:globalThis.__providerNetlifyPool});`,loader:'js'}));
 }}]});
 const saved={provider:process.env.DATABASE_PROVIDER,url:process.env.SUPABASE_DATABASE_URL};
 globalThis.__providerNetlifyPool={netlify:true};
 try {
  const {getDatabase}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
  delete process.env.DATABASE_PROVIDER;
  process.env.SUPABASE_DATABASE_URL='postgresql://postgres:secret@example.test:5432/postgres?sslmode=disable';
  assert.equal(getDatabase().pool,globalThis.__providerNetlifyPool);
  process.env.DATABASE_PROVIDER='invalid';assert.throws(getDatabase,/Unsupported/);
  process.env.DATABASE_PROVIDER='supabase';delete process.env.SUPABASE_DATABASE_URL;assert.throws(getDatabase,/required/);
  process.env.SUPABASE_DATABASE_URL='postgresql://postgres:secret@example.test:5432/postgres?sslmode=disable';
  const pool=getDatabase().pool;
  assert.equal(pool.options.max,1);assert.equal(pool.options.ssl.rejectUnauthorized,true);
  assert.equal(new URL(pool.options.connectionString).searchParams.has('sslmode'),false);
  assert.equal(getDatabase().pool,pool);
 } finally {
  for (const [key,value] of [['DATABASE_PROVIDER',saved.provider],['SUPABASE_DATABASE_URL',saved.url]]) {if(value===undefined)delete process.env[key];else process.env[key]=value;}
  delete globalThis.__providerNetlifyPool;
 }
});
