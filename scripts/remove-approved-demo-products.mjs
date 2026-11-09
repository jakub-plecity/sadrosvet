// Removes ONLY the 20 historical demo product IDs approved by the store owner.
// Run in --check mode first. Never execute from a normal deploy or build.
import {getDatabase} from '../lib/database-pool.mjs';

const approved = new Map([
  ['sample-vase', 'Váza Linie'],
  ['sample-shell', 'Miska Mušle'],
  ['sample-tray', 'Podnos Oblouk'],
  ['sample-candle', 'Vonná svíčka Forma'],
  ['sample-vase-mini', 'Váza Linie Mini'],
  ['sample-vase-maxi', 'Váza Linie Maxi'],
  ['sample-vase-natural', 'Váza Přírodní'],
  ['sample-bowl-pearl', 'Miska Perla'],
  ['sample-bowl-shell-mini', 'Miska Mušle Mini'],
  ['sample-bowl-shell-maxi', 'Miska Mušle Maxi'],
  ['sample-tray-mini', 'Podnos Oblouk Mini'],
  ['sample-tray-maxi', 'Podnos Oblouk Maxi'],
  ['sample-tray-stone', 'Podnos Kámen'],
  ['sample-candle-vanilla', 'Vonná svíčka Vanilka'],
  ['sample-candle-lavender', 'Vonná svíčka Levandule'],
  ['sample-candle-cotton', 'Vonná svíčka Bavlna'],
  ['sample-set-home', 'Set Domov'],
  ['sample-set-jewels', 'Set Šperkovnice'],
  ['sample-set-evening', 'Set Klidný večer'],
  ['sample-set-gift', 'Dárkový set SádroSvět'],
]);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
if(args.some(arg=>!['--check','--apply'].includes(arg)) || (args.includes('--apply') && args.includes('--check'))){
  throw Error('Use exactly one mode: --check or --apply');
}
if(apply && process.env.ALLOW_DEMO_PRODUCT_DELETION !== 'true'){
  throw Error('Set ALLOW_DEMO_PRODUCT_DELETION=true after reviewing the check report');
}
if(approved.size !== 20)throw Error('Approved ID count mismatch');

const {pool} = getDatabase();
const client = await pool.connect();
let inTransaction=false;
try {
  await client.query('BEGIN');
  inTransaction=true;
  const result=await client.query(
    'SELECT id,name,sample FROM products WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE',
    [[...approved.keys()]]
  );
  for(const row of result.rows){
    if(approved.get(row.id)!==row.name || Number(row.sample)!==1){
      throw Error('Product ID/name/sample mismatch: '+row.id);
    }
  }
  const current=result.rows.map(row=>row.id);
  const missing=[...approved.keys()].filter(id=>!current.includes(id));
  const references= current.length
    ? (await client.query(
      'SELECT product_id, count(*)::int AS count FROM customer_order_items WHERE product_id=ANY($1::text[]) GROUP BY product_id ORDER BY product_id',
      [current]
    )).rows
    : [];
  // Never discard products with historical order-item references.
  const report={mode:apply?'apply':'check',approved:approved.size,found:result.rows.length,missing,
    matches:result.rows.map(row=>({id:row.id,name:row.name})),orderReferences:references};
  if(references.length)throw Error('Historical order references prevent deletion: '+JSON.stringify(report));
  if(apply){
    const deletion=await client.query(
      'DELETE FROM products WHERE id=ANY($1::text[]) AND sample=1 RETURNING id',
      [current]
    );
    if(deletion.rowCount!==current.length)throw Error('Deletion count mismatch; transaction rolled back');
    await client.query('COMMIT');
    inTransaction=false;
    console.log(JSON.stringify({...report,deleted:deletion.rowCount},null,2));
  }else{
    await client.query('ROLLBACK');
    inTransaction=false;
    console.log(JSON.stringify({...report,deleted:0},null,2));
  }
}catch(error){
  if(inTransaction)await client.query('ROLLBACK');
  console.error('Approved demo cleanup NOT completed:',error.message);
  process.exitCode=1;
}finally{
  client.release();
  await pool.end();
}
