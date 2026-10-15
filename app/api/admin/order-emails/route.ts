import {guard} from "@/lib/server";
import {getDatabase} from "@netlify/database";
import {sendEmail} from "@/lib/resend";
export const dynamic="force-dynamic";
type Row=Record<string,unknown>;
type Client={query:(sql:string,args?:unknown[])=>Promise<{rows:Row[],rowCount:number|null}>;release:()=>void};
const pool=()=>getDatabase().pool as unknown as {connect:()=>Promise<Client>};
export async function GET(){
 const denied=await guard();if(denied)return denied;
 try{
  const c=await pool().connect();
  try{const r=await c.query("SELECT status,COUNT(*)::int AS count FROM order_email_outbox GROUP BY status");return Response.json({counts:r.rows},{headers:{"Cache-Control":"no-store"}});}
  finally{c.release();}
 }catch{return Response.json({error:"Stav e-mailů se nepodařilo načíst."},{status:503});}
}
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 // Deliberate opt-in: no real transactional emails before go-live.
 if(process.env.ENABLE_REAL_CHECKOUT!=="true")return Response.json({error:"Odesílání objednávek zatím není aktivní."},{status:503});
 const c=await pool().connect();let begun=false;
 try{
  await c.query("BEGIN");begun=true;
  const claim=await c.query(`UPDATE order_email_outbox SET status='sending',attempts=attempts+1,retry_after=NOW()+INTERVAL '5 minutes'
   WHERE id IN (SELECT id FROM order_email_outbox WHERE
   (status IN ('pending','failed') AND (retry_after IS NULL OR retry_after<=NOW()))
   OR (status='sending' AND retry_after<=NOW())
   ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
   RETURNING id,order_id,event_type,recipient`);
  await c.query("COMMIT");begun=false;
  if(!claim.rows.length)return Response.json({processed:0,message:"Žádný čekající e-mail."});
  const job=claim.rows[0];
  const order=await c.query("SELECT order_number,customer_name,total_minor,service,payment_method FROM customer_orders WHERE id=$1",[job.order_id]);
  const lines=await c.query("SELECT name,quantity,unit_price_minor FROM customer_order_items WHERE order_id=$1 ORDER BY name",[job.order_id]);
  if(!order.rows.length)throw new Error("Objednávka nebyla nalezena.");
  const o=order.rows[0];const title="SádroSvět — potvrzení objednávky č. "+o.order_number;
  const body=[
   "Dobrý den, "+o.customer_name+",",
   "",
   "Potvrzujeme přijetí Vaší objednávky č. "+o.order_number+".",
   "",
   ...lines.rows.map(i=>i.name+" × "+i.quantity+" — "+(Number(i.unit_price_minor)*Number(i.quantity)/100).toFixed(2)+" Kč"),
   "",
   "Celkem včetně dopravy: "+(Number(o.total_minor)/100).toFixed(2)+" Kč",
   "Doprava: "+o.service,
   "Platba: "+(o.payment_method==="cash"?"hotově při osobním převzetí":"dobírka"),
   "",
   "Obchodní podmínky: https://sadrosvet.cz/obchodni-podminky",
   "Formulář pro odstoupení: https://sadrosvet.cz/formular-pro-odstoupeni",
   "",
   "SádroSvět"
  ].join("\n");
  try{
   const messageId=await sendEmail({to:String(job.recipient),subject:title,text:body,idempotencyKey:"order-"+job.id});
   await c.query("UPDATE order_email_outbox SET status='sent',sent_at=NOW(),provider_message_id=$2,retry_after=NULL WHERE id=$1",[job.id,messageId]);
   return Response.json({processed:1,deliveredToProvider:true});
  }catch(err){
   console.error("Order email failed",err);
   await c.query("UPDATE order_email_outbox SET status='failed',retry_after=NOW()+INTERVAL '5 minutes' WHERE id=$1",[job.id]);
   return Response.json({error:"Resend e-mail nepřijal; záznam zůstává připravený na opakování."},{status:502});
  }
 }catch(err){if(begun)await c.query("ROLLBACK");console.error("Outbox failure",err);return Response.json({error:"Zpracování e-mailu selhalo."},{status:503});}
 finally{c.release();}
}
