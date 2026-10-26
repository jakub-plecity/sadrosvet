import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {applyCatalogCorrection} from '../scripts/correct-miska-category.mjs';
test('catalog correction moves only the named product once and preserves subsequent admin edits',async()=>{
 const db=new PGlite();
 await db.exec("CREATE TABLE settings(key text PRIMARY KEY,value text); CREATE TABLE products(id text PRIMARY KEY,name text,category text,revision int,updated_at text); INSERT INTO products VALUES ('target','Kuba test miska','Vázy',1,''),('other','Jiná váza','Vázy',1,'');");
 const client={query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.affectedRows??r.rows.length};},release(){}};
 const pool={connect:async()=>client,end:async()=>{}};
 await applyCatalogCorrection(pool);
 assert.equal((await db.query("SELECT category FROM products WHERE id='target'")).rows[0].category,'Misky');
 assert.equal((await db.query("SELECT category FROM products WHERE id='other'")).rows[0].category,'Vázy');
 await db.exec("UPDATE products SET category='Nová' WHERE id='target'");
 await applyCatalogCorrection(pool);
 assert.equal((await db.query("SELECT category FROM products WHERE id='target'")).rows[0].category,'Nová');
 await db.close();
});
