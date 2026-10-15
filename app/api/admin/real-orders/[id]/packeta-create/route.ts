import {guard} from "@/lib/server";
import {getDatabase} from "@netlify/database";
import {createPacketaPacket} from "@/lib/packeta-api";
import {z} from "zod";
export const dynamic="force-dynamic";
const schema=z.object({weightGrams:z.number().int().min(1).max(30000)}).strict();
type Client={query:(sql:string,args?:unknown[])=>Promise<{rows:Record<string,unknown>[],rowCount:number|null}>;release:()=>void};
export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const {id}=await ctx.params;if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatná objednávka."},{status:400});
 let data;try{const raw=await request.text();if(raw.length>1000)return Response.json({error:"Příliš velký požadavek."},{status:413});data=schema.parse(JSON.parse(raw));}catch{return Response.json({error:"Vyplň skutečnou hmotnost balíku v gramech."},{status:400});}
 if(!process.env.PACKETA_API_PASSWORD||!process.env.PACKETA_SENDER_INDICATION)return Response.json({error:"Nejdříve nastav PACKETA_API_PASSWORD a PACKETA_SENDER_INDICATION v Netlify."},{status:503});
 const db=getDatabase().pool;
 const client=await db.connect() as Client;let begun=false;let reserved=false;
 try{
  await client.query("BEGIN");begun=true;
  const r=await client.query("SELECT * FROM customer_orders WHERE id=$1 FOR UPDATE",[id]);
  const o=r.rows[0];
  if(!o){await client.query("ROLLBACK");begun=false;return Response.json({error:"Objednávka nenalezena."},{status:404});}
  if(!["packeta-point","packeta-address"].includes(String(o.service))||["cancelled","shipped","completed"].includes(String(o.status))){await client.query("ROLLBACK");begun=false;return Response.json({error:"Zásilku pro tuto objednávku nelze vytvořit."},{status:409});}
  const previous=await client.query("SELECT state,barcode FROM packeta_api_operations WHERE order_id=$1",[id]);
  if(previous.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Zásilka už byla založena nebo se její vytvoření musí nejprve prověřit v klientské sekci. API volání neopakuj.",state:previous.rows[0].state,barcode:previous.rows[0].barcode},{status:409});}
  const tracking=await client.query("SELECT external_tracking_code FROM order_shipments WHERE order_id=$1",[id]);
  if(tracking.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Tato objednávka již má evidovanou zásilku."},{status:409});}
  if(String(o.service)==="packeta-address"&&!process.env.PACKETA_HOME_DELIVERY_CARRIER_ID){await client.query("ROLLBACK");begun=false;return Response.json({error:"Pro doručení na adresu je potřeba ověřené PACKETA_HOME_DELIVERY_CARRIER_ID."},{status:503});}
  await client.query("INSERT INTO packeta_api_operations(order_id,state) VALUES($1,'creating')",[id]);
  await client.query("COMMIT");begun=false;reserved=true;
  const fullname=String(o.customer_name).trim().split(/\s+/);
  const surname=fullname.length>1?fullname.pop()!:"";
  const name=fullname.join(" ")||surname;
  const point=o.pickup_point as {id?:string}|null;
  const address=o.shipping_address as {street?:string;house?:string;city?:string;zip?:string}|null;
  const addressId=String(o.service)==="packeta-point"?String(point?.id??""):String(process.env.PACKETA_HOME_DELIVERY_CARRIER_ID??"");
  if(!/^\d{1,12}$/.test(addressId))throw new Error("Nesprávné ID výdejního místa nebo dopravce.");
  const packet=await createPacketaPacket({
   number:"SS-"+o.order_number,name,surname,email:String(o.customer_email),phone:String(o.customer_phone),
   addressId,weightGrams:data.weightGrams,
   cod:Number(o.total_minor)/100,value:Number(o.subtotal_minor)/100,
   ...(address?{street:address.street,house:address.house,city:address.city,zip:address.zip}:{})
  });
  const c=await db.connect() as Client;let trans=false;
  try{await c.query("BEGIN");trans=true;
   await c.query("INSERT INTO order_shipments(order_id,carrier,external_tracking_code,weight_grams) VALUES($1,'packeta',$2,$3)",[id,packet.barcode,data.weightGrams]);
   await c.query("UPDATE packeta_api_operations SET state='created',packet_id=$2,barcode=$3,updated_at=NOW() WHERE order_id=$1",[id,packet.id,packet.barcode]);
   await c.query("COMMIT");trans=false;
  }catch(e){if(trans)await c.query("ROLLBACK");throw e;}finally{c.release();}
  return Response.json({created:true,barcode:packet.barcode,labelUrl:"/api/admin/real-orders/"+id+"/packeta-label"},{status:201});
 }catch(e){
  if(begun)await client.query("ROLLBACK");
  if(reserved){try{await db.query("UPDATE packeta_api_operations SET state='review',error_code='VERIFY_IN_PACKETA',updated_at=NOW() WHERE order_id=$1 AND state='creating'",[id]);}catch{}}
  console.error("Packeta shipment requires review",id,e instanceof Error?e.name:"error");
  return Response.json({error:"Zásilku se nepodařilo bezpečně potvrdit. Ověř ji v klientské sekci Zásilkovny podle čísla objednávky. Nové vytvoření zatím neopakuj."},{status:502});
 }finally{client.release();}
}
