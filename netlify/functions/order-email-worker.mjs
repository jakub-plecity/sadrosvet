import {getDatabase} from "@netlify/database";
export const config={schedule:"*/5 * * * *"};
export default async function(){
 if(process.env.ENABLE_REAL_CHECKOUT!=="true")return;
 const db=getDatabase().pool;
 for(let n=0;n<5;n++){
  const client=await db.connect();let job;
  try{
   await client.query("BEGIN");
   const found=await client.query(`SELECT id,order_id,event_type,recipient FROM order_email_outbox WHERE
    (status IN ('pending','failed') AND (retry_after IS NULL OR retry_after<=NOW()))
    OR (status='sending' AND retry_after<=NOW())
    ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`);
   if(found.rows.length){
    job=found.rows[0];
    await client.query("UPDATE order_email_outbox SET status='sending',attempts=attempts+1,retry_after=NOW()+INTERVAL '5 minutes' WHERE id=$1",[job.id]);
   }
   await client.query("COMMIT");
  }catch(e){await client.query("ROLLBACK");console.error("Email outbox claim failed",e);break;}
  finally{client.release();}
  if(!job)break;
  try{
   const order=(await db.query("SELECT order_number,customer_name,total_minor,service,payment_method FROM customer_orders WHERE id=$1",[job.order_id])).rows[0];
   if(!order)throw new Error("Order missing");
   // Never mail a placed confirmation for an unpaid Comgate order, even if queued previously.
   if(job.event_type==="placed"&&order.payment_method==="comgate"){
    const status=(await db.query("SELECT payment_status FROM customer_orders WHERE id=$1",[job.order_id])).rows[0]?.payment_status;
    if(status!=="paid"){
     await db.query("UPDATE order_email_outbox SET status='failed',retry_after=NOW()+INTERVAL '1 hour' WHERE id=$1",[job.id]);
     continue;
    }
   }
   const items=(await db.query("SELECT name,quantity,unit_price_minor FROM customer_order_items WHERE order_id=$1 ORDER BY name",[job.order_id])).rows;
   const eventLabels={placed:"přijetí",cancelled:"storno",shipped:"odeslání",ready_for_pickup:"připravení k vyzvednutí"};
   const subject="SádroSvět — "+(eventLabels[job.event_type]??"stav")+" objednávky č. "+order.order_number;
   const text=[
    "SádroSvět — objednávka č. "+order.order_number,
    "Dobrý den, "+order.customer_name+",",
    job.event_type==="placed"?"Potvrzujeme přijetí Vaší objednávky.":"Stav Vaší objednávky se změnil: "+job.event_type,
    "",
    ...items.map(i=>i.quantity+"× "+i.name+" — "+(i.quantity*i.unit_price_minor/100).toFixed(2)+" Kč"),
    "Celkem včetně dopravy: "+(order.total_minor/100).toFixed(2)+" Kč",
    "Doprava: "+order.service,
    "Platba: "+(order.payment_method==="cash"?"Hotově při osobním převzetí":order.payment_method==="comgate"?"Online platba Comgate":"Dobírka"),
    "",
    "Obchodní podmínky: https://sadrosvet.cz/obchodni-podminky",
    "Odstoupení: https://sadrosvet.cz/formular-pro-odstoupeni",
    "Kontakt: sadrosvet@seznam.cz"
   ].join("\n");
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"order-"+job.id},body:JSON.stringify({from:process.env.ORDER_EMAIL_FROM,to:[job.recipient],reply_to:process.env.ORDER_EMAIL_REPLY_TO??"sadrosvet@seznam.cz",subject,text}),signal:AbortSignal.timeout(12000)});
   const result=await response.json();
   if(!response.ok||!result.id)throw new Error("Resend rejected mail ("+response.status+")");
   await db.query("UPDATE order_email_outbox SET status='sent',provider_message_id=$2,sent_at=NOW(),retry_after=NULL WHERE id=$1",[job.id,result.id]);
  }catch(e){
   console.error("Order email delivery failed",job.id,e);
   await db.query("UPDATE order_email_outbox SET status='failed',retry_after=NOW()+INTERVAL '10 minutes' WHERE id=$1",[job.id]);
  }
 }
}
