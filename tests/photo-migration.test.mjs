import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {migratePhotoObjects} from '../scripts/migrate-photo-objects.mjs';
test('photo migration verifies bytes, copies gallery-only images and resumes without downloads',async()=>{
 const db=new PGlite();
 await db.exec("CREATE TABLE photos(image text);CREATE TABLE products(image text,images text);INSERT INTO photos VALUES('/api/images/photo-a');INSERT INTO products VALUES('/api/images/photo-a','[\"/api/images/photo-b\"]');");
 await db.exec(await readFile('db/migrations/20261029140000_photo_objects.sql','utf8'));
 let downloads=0;
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=','base64');
 const fetchImage=async()=>{downloads++;return new Response(bytes);};
 const result=await migratePhotoObjects(db,{fetchImage});assert.equal(result.photos,2);assert.equal(result.totalBytes,2*bytes.length);assert.equal(downloads,2);
 await migratePhotoObjects(db,{fetchImage});assert.equal(downloads,2);
 await db.query("UPDATE photo_objects SET sha256='broken' WHERE key='photo-a'");
 await assert.rejects(migratePhotoObjects(db,{fetchImage}),/verification failed/);
 await db.close();
});
