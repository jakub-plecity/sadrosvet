import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {applyCatalogCorrection} from '../scripts/correct-miska-category.mjs';
test('catalog correction moves only the named product once and preserves subsequent admin edits',async()=>{
 const db=new PGlite();
 await db.exec("CREATE TABLE settings(key text PRIMARY KEY,value text); CREATE TABLE products(id text PRIMARY KEY,name text,category text,revision int,updated_at text); INSERT INTO products VALUES ('target','Kuba test miska','Vázy',1,''),('other','Jiná váza','Vázy',1,'');");
 const client={query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.rows.length||r.affectedRows||0};},release(){}};
 const pool={connect:async()=>client,end:async()=>{}};
 await applyCatalogCorrection(pool);
 assert.equal((await db.query("SELECT category FROM products WHERE id='target'")).rows[0].category,'Misky');
 assert.equal((await db.query("SELECT category FROM products WHERE id='other'")).rows[0].category,'Vázy');
 await db.exec("UPDATE products SET category='Nová' WHERE id='target'");
 await applyCatalogCorrection(pool);
 assert.equal((await db.query("SELECT category FROM products WHERE id='target'")).rows[0].category,'Nová');
 await db.close();
});

test('formal catalog copy preserves corrected measurements and future admin edits',async()=>{
 const {applyFormalCatalogCopy}=await import('../scripts/formal-catalog-copy.mjs');
 const db=new PGlite();
 await db.exec("CREATE TABLE settings(key text PRIMARY KEY,value text);CREATE TABLE products(id text PRIMARY KEY,description text,detailed_description text,dimensions text,weight text,revision int,updated_at text);INSERT INTO products VALUES('533f22e7-c954-493c-9c5b-23d019cc114f','Inspiraci najdeš na Instagramu.','Více o použitém materiálu zde.','2x2x2','100',1,''),('correct','Jiný výrobek','','20 cm','200 g',1,'');");
 const client={query:async(sql,args)=>{const r=await db.query(sql,args);return {...r,rowCount:r.rows.length||r.affectedRows||0};},release(){}};
 const pool={connect:async()=>client,end:async()=>{}};
 await applyFormalCatalogCopy(pool);
 const row=(await db.query("SELECT * FROM products WHERE id='533f22e7-c954-493c-9c5b-23d019cc114f'")).rows[0];
 assert.match(row.description,/najdete/);assert.equal(row.dimensions,'');assert.equal(row.weight,'');
 assert.equal((await db.query("SELECT dimensions FROM products WHERE id='correct'")).rows[0].dimensions,'20 cm');
 await db.exec("UPDATE products SET dimensions='25 cm' WHERE id='533f22e7-c954-493c-9c5b-23d019cc114f'");
 await applyFormalCatalogCopy(pool);
 assert.equal((await db.query("SELECT dimensions FROM products WHERE id='533f22e7-c954-493c-9c5b-23d019cc114f'")).rows[0].dimensions,'25 cm');
 await db.close();
});
