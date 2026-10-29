import {readFile} from 'node:fs/promises';
import {getDatabase} from '../lib/database-pool.mjs';
import {migratePhotoObjects} from './migrate-photo-objects.mjs';
const pool=getDatabase().pool;
try{
 const schema=await readFile(new URL('../db/migrations/20261029140000_photo_objects.sql',import.meta.url),'utf8');
 await pool.query(schema);
 await pool.query('REVOKE ALL ON photo_objects FROM anon, authenticated');
 const before=Number((await pool.query('SELECT pg_database_size(current_database()) AS size')).rows[0].size);
 if(before>400*1024*1024)throw Error('Database size requires review before photo import');
 const photos=await migratePhotoObjects(pool,{sourceOrigin:"https://6adfae2d4105762839ce0cd8--sadrosvet.netlify.app"});
 const summary=(await pool.query("SELECT (SELECT count(*)::int FROM products) AS products,(SELECT count(*)::int FROM customer_orders) AS orders,EXISTS(SELECT 1 FROM sadrosvet_backups.exports) AS backup")).rows[0];
 if(!summary.backup)throw Error('Verified private migration backup is missing');
 console.log(JSON.stringify({provider:'supabase',...summary,...photos,databaseBytes:Number((await pool.query('SELECT pg_database_size(current_database()) AS size')).rows[0].size)}));
}catch(error){console.error('Supabase production validation failed:',error?.code||error?.name||'VALIDATION_FAILED');process.exitCode=1;}
finally{await pool.end();}
