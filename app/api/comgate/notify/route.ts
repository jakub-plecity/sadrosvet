import {getDatabase} from "@netlify/database";
import {verifyComgatePayment} from "@/lib/comgate";
export const dynamic="force-dynamic";
const plain={"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"};
type Row=Record<string,unknown>;
type Client={query:(sql:string,params?:unknown[])=>Promise<{rows:Row[]}>;release:()=>void};
export async function POST(request:Request){
 if(!request.headers.get("content-type")?.toLowerCase().includes("application/x-www-form-urlencoded"))
  return new Response("Unsupported format",{status:415,headers:plain});
 const raw=await request.text();
 if(raw.length>4096)return new Response("Too large",{status:413,headers:plain});
 const fields=new URLSearchParams(raw);
 const transId=fields.get("transId")??"";
 const merchant=fields.get("merchant")??"";
 if(!/^[a-zA-Z0-9-]{6,64}$/.test(transId)||merchant!==process.env.COMGATE_MERCHANT)
  return new Response("Invalid notification",{status:400,headers:plain});
 // The notification is untrusted. Recheck against authenticated Comgate API before DB update.
 let remote;
 try{remote=await verifyComgatePayment(transId)}catch{return new Response("Verification unavailable",{status:503,headers:plain})}
 const client=await (getDatabase().pool as unknown as {connect:()=>Promise<Client>}).connect();
 let begun=false;
 try{
  await client.query("BEGIN");begun=true;
  const q=await client.query("SELECT p.*,o.payment_status,o.total_minor,o.order_number,o.status AS order_status FROM comgate_payments p JOIN customer_orders o ON o.id=p.order_id WHERE p.trans_id=$1 FOR UPDATE OF p,o",[transId]);
  if(!q.rows.length){await client.query("ROLLBACK");begun=false;return new Response("Unknown transaction",{status:404,headers:plain})}
  const p=q.rows[0];
  const valid=remote.transId===transId&&remote.refId===String(p.ref_id)&&remote.priceMinor===Number(p.amount_minor)&&remote.priceMinor===Number(p.total_minor)&&remote.currency==="CZK"&&remote.currency===String(p.currency)&&remote.test===Boolean(p.test);
  const state=remote.status==="PAID"?"paid":remote.status==="CANCELLED"?"cancelled":remote.status==="PENDING"?"pending":null;
  await client.query("INSERT INTO comgate_payment_events(id,payment_id,reported_state,verified_state,accepted) VALUES($1,$2,$3,$4,$5)",[crypto.randomUUID(),String(p.id),(fields.get("status")??"").slice(0,64),remote.status,valid&&state!==null]);
  if(!valid||!state){await client.query("COMMIT");begun=false;return new Response("Verification mismatch",{status:409,headers:plain})}
  if(String(p.state)!=="paid"){
   if(state==="paid"){
    await client.query("UPDATE comgate_payments SET state='paid',updated_at=NOW(),verified_at=NOW() WHERE id=$1",[p.id]);
    // Test transactions must NEVER mark real orders paid.
    if(p.test===false&&String(p.order_status)!=="cancelled")
     await client.query("UPDATE customer_orders SET payment_status='paid',updated_at=NOW() WHERE id=$1 AND payment_method='comgate' AND payment_status='unpaid'",[p.order_id]);
   }else{
    await client.query("UPDATE comgate_payments SET state=$2,updated_at=NOW(),verified_at=NOW() WHERE id=$1",[p.id,state]);
    // CANCELLED is a final state in Comgate. Restore reserved stock at most once,
    // but only for an unpaid online order. An already paid or cancelled order is immutable here.
    if(state==="cancelled"&&String(p.payment_status)==="unpaid"&&String(p.order_status)!=="cancelled"){
     const updated=await client.query("UPDATE customer_orders SET status='cancelled',updated_at=NOW() WHERE id=$1 AND payment_method='comgate' AND payment_status='unpaid' AND status<>'cancelled' RETURNING id",[p.order_id]);
     if(updated.rows.length){
      const items=await client.query("SELECT product_id,quantity FROM customer_order_items WHERE order_id=$1 ORDER BY product_id",[p.order_id]);
      for(const item of items.rows){
       await client.query("UPDATE products SET stock=stock+$2,revision=revision+1,updated_at=NOW() WHERE id=$1",[item.product_id,item.quantity]);
      }
      // Do not send 'cancelled' emails for sandbox transactions.
      if(p.test===false){
       await client.query("INSERT INTO order_email_outbox(id,order_id,event_type,recipient) SELECT $1,$2,'cancelled',customer_email FROM customer_orders WHERE id=$2 ON CONFLICT(order_id,event_type,recipient) DO NOTHING",[crypto.randomUUID(),p.order_id]);
      }
     }
    }
   }
  }
  await client.query("COMMIT");begun=false;
  return new Response("code=0&message=OK",{status:200,headers:plain});
 }catch(error){
  if(begun)await client.query("ROLLBACK");
  console.error("Comgate notification processing failed",error);
  return new Response("Processing unavailable",{status:503,headers:plain});
 }finally{client.release()}
}
export async function GET(){return new Response("Method not allowed",{status:405,headers:plain})}
