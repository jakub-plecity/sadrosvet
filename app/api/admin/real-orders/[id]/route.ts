import {guard} from "@/lib/server";
import {getDatabase} from "@netlify/database";
import {z} from "zod";
export const dynamic="force-dynamic";
const schema=z.object({status:z.enum(["confirmed","processing","shipped","ready_for_pickup","completed","cancelled"])}).strict();
type Client={query:(sql:string,args?:unknown[])=>Promise<{rows:Record<string,unknown>[],rowCount:number|null}>;release:()=>void};
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const id=(await context.params).id;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatné ID."},{status:400});
 let data;try{data=schema.parse(await request.json());}catch{return Response.json({error:"Neplatný stav."},{status:400});}
 const client=await (getDatabase().pool as unknown as {connect:()=>Promise<Client>}).connect();let begun=false;
 try{
  await client.query("BEGIN");begun=true;
  const found=await client.query("SELECT status,customer_email FROM customer_orders WHERE id=$1 FOR UPDATE",[id]);
  if(!found.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Objednávka nenalezena."},{status:404});}
  const prev=String(found.rows[0].status);
  if(prev===data.status){await client.query("COMMIT");begun=false;return Response.json({status:prev});}
  if(prev==="cancelled"||prev==="completed"){await client.query("ROLLBACK");begun=false;return Response.json({error:"Uzavřenou objednávku nelze znovu změnit."},{status:409});}
  const allowed:Record<string,string[]>={pending:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","ready_for_pickup","cancelled"],shipped:["completed"],ready_for_pickup:["completed","cancelled"]};
  if(!allowed[prev]?.includes(data.status)){await client.query("ROLLBACK");begun=false;return Response.json({error:"Tento přechod stavu není povolen."},{status:409});}
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
