import "server-only";
import {getDatabase} from "@netlify/database";
import type {RealOrderInput} from "./order-input";
import {quote} from "./checkout";
type Row=Record<string,unknown>;
type Client={query:(sql:string,params?:unknown[])=>Promise<{rows:Row[],rowCount:number|null}>;release:()=>void};
export class OrderConflict extends Error {}
export class OrderUnavailable extends Error {}
export async function createRealOrder(input:RealOrderInput,requestHash:string){
 const client=await (getDatabase().pool as unknown as {connect:()=>Promise<Client>}).connect();
 let begun=false;
 try{
  await client.query("BEGIN");begun=true;
  // Serialize identical IDs before any stock mutation.
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[input.id]);
  const prior=await client.query("SELECT id,order_number,total_minor,request_hash,payment_method FROM customer_orders WHERE id=$1",[input.id]);
  if(prior.rows.length){
   if(prior.rows[0].request_hash!==requestHash)throw new OrderConflict("Toto ID objednávky už bylo použito s jinými údaji.");
   await client.query("COMMIT");begun=false;
   return {id:input.id,orderNumber:String(prior.rows[0].order_number),totalMinor:Number(prior.rows[0].total_minor),paymentMethod:String(prior.rows[0].payment_method),duplicate:true};
  }
  // Lock products in a stable order to avoid deadlocks with overlapping carts.
  const ids=[...input.items.map(i=>i.id)].sort();
  const result=await client.query("SELECT id,name,price_minor,stock,status FROM products WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE",[ids]);
  const indexed=new Map(result.rows.map(p=>[String(p.id),p]));
  let subtotal=0;
  const details=[];
  for(const item of input.items){
   const product=indexed.get(item.id);
   if(!product||product.status!=="active"||Number(product.stock)<item.quantity)throw new OrderUnavailable("Některý produkt již není dostupný v požadovaném množství.");
   const unit=Number(product.price_minor);
   subtotal+=unit*item.quantity;
   details.push({id:item.id,name:String(product.name),unit,quantity:item.quantity});
  }
  const prices=quote(subtotal,input.delivery);
  if(prices.rateKind==="illustrative")throw new OrderUnavailable("Ceny Zásilkovny zatím nejsou schválené pro skutečný prodej.");
  if(prices.totalMinor!==input.expectedTotalMinor)throw new OrderConflict("Cena objednávky se změnila. Obnovte košík.");
  const {service,payment,point}=input.delivery;
  const inserted=await client.query(`INSERT INTO customer_orders
   (id,request_hash,payment_method,service,customer_name,customer_email,customer_phone,
   shipping_address,billing_address,pickup_point,customer_note,subtotal_minor,shipping_minor,cod_minor,total_minor,company)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16::jsonb)
   RETURNING order_number`,[
    input.id,requestHash,payment,service,input.contact.name,input.contact.email,input.contact.phone,
    input.shippingAddress?JSON.stringify(input.shippingAddress):null,
    input.billingAddress?JSON.stringify(input.billingAddress):null,
    point?JSON.stringify(point):null,input.note,prices.subtotalMinor,prices.shippingMinor,prices.codMinor,prices.totalMinor,input.company?JSON.stringify(input.company):null
  ]);
  for(const item of details){
   const updated=await client.query("UPDATE products SET stock=stock-$1,revision=revision+1,updated_at=$3 WHERE id=$2 AND stock >= $1 RETURNING id",
    [item.quantity,item.id,new Date().toISOString()]);
   if(!updated.rowCount)throw new OrderUnavailable("Produkt byl mezitím vyprodán.");
   await client.query("INSERT INTO customer_order_items (order_id,product_id,name,unit_price_minor,quantity) VALUES($1,$2,$3,$4,$5)",
    [input.id,item.id,item.name,item.unit,item.quantity]);
  }
  if(payment!=="comgate"){
  await client.query("INSERT INTO order_email_outbox(id,order_id,event_type,recipient) VALUES ($1,$2,'placed',$3)",
    [crypto.randomUUID(),input.id,input.contact.email]);
  await client.query("INSERT INTO order_email_outbox(id,order_id,event_type,recipient) VALUES ($1,$2,'placed',$3) ON CONFLICT(order_id,event_type,recipient) DO NOTHING",
    [crypto.randomUUID(),input.id,"sadrosvet@seznam.cz"]);
  }
  await client.query("COMMIT");begun=false;
  return {id:input.id,orderNumber:String(inserted.rows[0].order_number),totalMinor:prices.totalMinor,paymentMethod:payment,duplicate:false};
 }catch(error){if(begun)await client.query("ROLLBACK");throw error;}finally{client.release();}
}
