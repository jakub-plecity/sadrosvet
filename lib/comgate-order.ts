import "server-only";
import {getDatabase} from "@netlify/database";
import {createComgatePayment} from "@/lib/comgate";
type Row=Record<string,unknown>;
type Client={query:(sql:string,params?:unknown[])=>Promise<{rows:Row[],rowCount:number|null}>;release:()=>void};
export async function beginComgatePayment(orderId:string){
 // Integration remains test-only and opt-in until completed live reviews and E2E checks.
 if(process.env.ENABLE_REAL_CHECKOUT!=="true"||process.env.ENABLE_COMGATE_CHECKOUT!=="true"||process.env.COMGATE_TEST!=="false")
  throw new Error("Ostré online platby nejsou dostupné.");
 const db=getDatabase().pool as unknown as {connect:()=>Promise<Client>};
 const c=await db.connect();
 let order:{orderNumber:string;email:string;name:string;service:string;priceMinor:number};
 let paymentId:string;
 let begun=false;
 try{
  await c.query("BEGIN");begun=true;
  const result=await c.query("SELECT id,order_number,total_minor,customer_email,customer_name,service FROM customer_orders WHERE id=$1 AND payment_method='comgate' AND payment_status='unpaid' AND status<>'cancelled' FOR UPDATE",[orderId]);
  if(result.rows.length!==1)throw new Error("Online objednávka nebyla nalezena.");
  const o=result.rows[0];
  order={orderNumber:String(o.order_number),email:String(o.customer_email),name:String(o.customer_name),service:String(o.service),priceMinor:Number(o.total_minor)};
  const previous=await c.query("SELECT id,trans_id,redirect_url,state FROM comgate_payments WHERE order_id=$1 FOR UPDATE",[orderId]);
  if(previous.rows.length){
   const p=previous.rows[0];
   if(p.trans_id&&p.redirect_url&&["created","pending"].includes(String(p.state))){
    await c.query("COMMIT");begun=false;
    return {redirect:String(p.redirect_url),transId:String(p.trans_id)};
   }
   throw new Error("Platba je již založená nebo vyžaduje ruční kontrolu. Nezakládáme druhou automaticky.");
  }
  paymentId=crypto.randomUUID();
  await c.query("INSERT INTO comgate_payments(id,order_id,state,amount_minor,currency,ref_id,test) VALUES ($1,$2,'created',$3,'CZK',$4,false)",[paymentId,orderId,order.priceMinor,order.orderNumber]);
  await c.query("COMMIT");begun=false;
 }catch(e){if(begun)await c.query("ROLLBACK");throw e}finally{c.release()}
 // Remote request outside DB transaction; persisted claim prevents concurrent duplicate creation.
 const payment=await createComgatePayment(order);
 const c2=await db.connect();
 try{
  const r=await c2.query("UPDATE comgate_payments SET trans_id=$2,redirect_url=$3,state='pending',updated_at=NOW() WHERE id=$1 AND trans_id IS NULL RETURNING id",[paymentId!,payment.transId,payment.redirect]);
  if(r.rowCount!==1)throw new Error("Platební transakci nelze bezpečně uložit. Kontaktujte podporu.");
 }finally{c2.release()}
 return payment;
}
