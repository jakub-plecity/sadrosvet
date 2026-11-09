import {guard} from "@/lib/server";
import {getDatabase} from "../../../../../lib/database-pool.mjs";
import {z} from "zod";
export const dynamic="force-dynamic";
const schema=z.object({status:z.enum(["confirmed","processing","shipped","ready_for_pickup","completed","cancelled"])}).strict();
type Client={query:(sql:string,args?:unknown[])=>Promise<{rows:Record<string,unknown>[],rowCount:number|null}>;release:()=>void};
// Full order details are served only to authenticated administrators.
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
 const denied=await guard();if(denied)return denied;
 const id=(await context.params).id;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatné ID objednávky."},{status:400});
 const headers={"Cache-Control":"private, no-store"};
 try{
  const db=getDatabase().pool;
  const order=await db.query(`SELECT id,order_number,created_at,updated_at,status,
   customer_name,customer_phone,customer_email,customer_note,company,
   shipping_address,billing_address,pickup_point,service,payment_method,payment_status,
   subtotal_minor,shipping_minor,cod_minor,total_minor
   FROM customer_orders WHERE id=$1`,[id]);
  if(!order.rows.length)return Response.json({error:"Objednávka nebyla nalezena."},{status:404,headers});
  const items=await db.query("SELECT product_id,name,unit_price_minor,quantity FROM customer_order_items WHERE order_id=$1 ORDER BY name",[id]);
  // Shipment records may not be present on older installations/orders.
  let shipment:null|{external_tracking_code:unknown;handed_over_at:unknown}=null;
  try{
   const shipmentRows=await db.query("SELECT external_tracking_code,handed_over_at FROM order_shipments WHERE order_id=$1 LIMIT 1",[id]);
   if(shipmentRows.rows.length)shipment={external_tracking_code:shipmentRows.rows[0].external_tracking_code,handed_over_at:shipmentRows.rows[0].handed_over_at};
  }catch{ /* Optional shipment record; keep the remaining order detail available. */ }
  return Response.json({order:{...order.rows[0],items:items.rows,shipment}},{headers});
 }catch(error){
  console.error("Admin order detail lookup",error);
  return Response.json({error:"Detail objednávky nelze načíst."},{status:503,headers});
 }
}
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const id=(await context.params).id;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatné ID."},{status:400});
 let data;try{data=schema.parse(await request.json());}catch{return Response.json({error:"Neplatný stav."},{status:400});}
 const client=await (getDatabase().pool as unknown as {connect:()=>Promise<Client>}).connect();let begun=false;
 try{
  await client.query("BEGIN");begun=true;
  const found=await client.query("SELECT status,customer_email,service,payment_method,payment_status FROM customer_orders WHERE id=$1 FOR UPDATE",[id]);
  if(!found.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Objednávka nenalezena."},{status:404});}
  const prev=String(found.rows[0].status);
  if(prev===data.status){await client.query("COMMIT");begun=false;return Response.json({status:prev});}
  if(prev==="cancelled"||prev==="completed"){await client.query("ROLLBACK");begun=false;return Response.json({error:"Uzavřenou objednávku nelze znovu změnit."},{status:409});}
  const allowed:Record<string,string[]>={pending:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","ready_for_pickup","cancelled"],shipped:["completed"],ready_for_pickup:["completed","cancelled"]};
  if(!allowed[prev]?.includes(data.status)){await client.query("ROLLBACK");begun=false;return Response.json({error:"Tento přechod stavu není povolen."},{status:409});}
  if(data.status==="shipped"&&String(found.rows[0].service).startsWith("packeta-")){
   const shipment=await client.query("SELECT external_tracking_code FROM order_shipments WHERE order_id=$1 FOR UPDATE",[id]);
   if(!shipment.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Před odesláním zadej číslo zásilky a její hmotnost."},{status:409});}
   await client.query("UPDATE order_shipments SET handed_over_at=NOW(),updated_at=NOW() WHERE order_id=$1",[id]);
  }
  if(data.status==="cancelled"&&found.rows[0].payment_method==="comgate"){
   // Never refund a paid payment by merely restoring inventory or changing an order status.
   if(found.rows[0].payment_status!=="unpaid"){
    await client.query("ROLLBACK");begun=false;
    return Response.json({error:"Zaplacenou online objednávku nelze zrušit bez ověření vratky u Comgate."},{status:409});
   }
   // A paid or pending remote transaction requires reconciliation, not a manual cancellation.
   const payments=await client.query("SELECT state,trans_id FROM comgate_payments WHERE order_id=$1 FOR UPDATE",[id]);
   if(payments.rows.some(p=>p.trans_id!==null||p.state!=="created")){
    await client.query("ROLLBACK");begun=false;
    return Response.json({error:"U této objednávky existuje platební transakce Comgate. Storno musí proběhnout po ověření jejího stavu."},{status:409});
   }
  }
  if(data.status==="cancelled"){
   const items=await client.query("SELECT product_id,quantity FROM customer_order_items WHERE order_id=$1 ORDER BY product_id",[id]);
   for(const item of items.rows){
    await client.query("UPDATE products SET stock=stock+$1,revision=revision+1,updated_at=$3 WHERE id=$2",[item.quantity,item.product_id,new Date().toISOString()]);
   }
  }
  await client.query("UPDATE customer_orders SET status=$2,updated_at=NOW() WHERE id=$1",[id,data.status]);
  const event=data.status==="cancelled"?"cancelled":data.status==="shipped"?"shipped":data.status==="ready_for_pickup"?"ready_for_pickup":null;
  if(event)await client.query("INSERT INTO order_email_outbox(id,order_id,event_type,recipient) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",[crypto.randomUUID(),id,event,found.rows[0].customer_email]);
  await client.query("COMMIT");begun=false;
  return Response.json({status:data.status});
 }catch(e){if(begun)await client.query("ROLLBACK");console.error("Order status",e);return Response.json({error:"Změnu stavu nelze uložit."},{status:503});}finally{client.release();}
}
