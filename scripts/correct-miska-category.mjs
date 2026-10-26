import {getDatabase} from '../lib/database-pool.mjs';
export async function applyCatalogCorrection(pool=getDatabase().pool,{closePool=true}={}) {
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const marker=await client.query("INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING key",['catalog-correction:20261026-miska-category','Misky']);
  if(marker.rowCount){
   const rows=await client.query("SELECT id,category FROM products WHERE name=$1 FOR UPDATE",['Kuba test miska']);
   if(rows.rowCount!==1)throw new Error('Catalog correction requires exactly one matching product');
   if(!['Vázy','Misky'].includes(rows.rows[0].category))throw new Error('Catalog category has changed; review correction');
   await client.query('UPDATE products SET category=$1, revision=revision+1, updated_at=$2 WHERE id=$3',['Misky',new Date().toISOString(),rows.rows[0].id]);
   console.log('Approved catalog correction applied: miska category Misky');
  }
  await client.query('COMMIT');
 } catch(error){await client.query('ROLLBACK');throw error;}
 finally {client.release();if(closePool)await pool.end();}
}
