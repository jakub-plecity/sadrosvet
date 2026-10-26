import {getDatabase} from '../lib/database-pool.mjs';
export async function applyFormalCatalogCopy(pool=getDatabase().pool){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const marker=await client.query("INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING key",['catalog-copy:20261026-formal','applied']);
  if(marker.rowCount){
   const replacements=[['najdeš','najdete'],['součásti tohoto produktu','součástí tohoto produktu'],['Více o použitém materiálu zde.','Více o použitém materiálu najdete v sekci Materiál a bezpečnostní informace.'],['Naše vybrané sety můžete najít zde:','Naše vybrané sety najdete v katalogu.'],['Vhodná na šperky, svíčky, dekorace','Vhodná na šperky, dekorativní svíčky a další dekorace'],['Vhodný na šperky, svíčky, dekorace','Vhodný na šperky, dekorativní svíčky a další dekorace']];
   for(const [before,after] of replacements)await client.query("UPDATE products SET description=replace(description,$1,$2),detailed_description=replace(detailed_description,$1,$2),revision=revision+1,updated_at=$3 WHERE strpos(description,$1)>0 OR strpos(detailed_description,$1)>0",[before,after,new Date().toISOString()]);
   // The owner confirmed these placeholders are incorrect; preserve any corrected values.
   await client.query("UPDATE products SET dimensions=CASE WHEN dimensions='2x2x2' THEN '' ELSE dimensions END,weight=CASE WHEN weight='100' THEN '' ELSE weight END,revision=revision+1,updated_at=$1 WHERE id=$2 AND (dimensions='2x2x2' OR weight='100')",[new Date().toISOString(),'533f22e7-c954-493c-9c5b-23d019cc114f']);
   console.log('Formal catalog copy applied; unconfirmed placeholder measurements cleared');
  }
  await client.query('COMMIT');
 }catch(error){await client.query('ROLLBACK');throw error;}
 finally{client.release();await pool.end();}
}
