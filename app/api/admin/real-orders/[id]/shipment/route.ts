import {guard} from "@/lib/server";
import {getDatabase} from "../../../../../../lib/database-pool.mjs";
import {z} from "zod";
export const dynamic="force-dynamic";
const schema=z.object({
 trackingCode:z.string().trim().regex(/^[A-Za-z0-9-]{4,80}$/),
 weightGrams:z.number().int().min(1).max(30000),
 note:z.string().trim().max(400).default("")
}).strict();
type Client={query:(sql:string,params?:unknown[])=>Promise<{rows:Record<string,unknown>[],rowCount:number|null}>;release:()=>void};
export async function PUT(request:Request,ctx:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const {id}=await ctx.params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatná objednávka."},{status:400});
 let input:z.infer<typeof schema>;
 try{const raw=await request.text();if(raw.length>1200)return Response.json({error:"Příliš velký požadavek."},{status:413});input=schema.parse(JSON.parse(raw));}
 catch{return Response.json({error:"Vyplň číslo zásilky a skutečnou hmotnost v gramech."},{status:400});}
 const client=await (getDatabase().pool as unknown as {connect:()=>Promise<Client>}).connect();
 let begun=false;
 try{
  await client.query("BEGIN");begun=true;
  const order=await client.query("SELECT service,status FROM customer_orders WHERE id=$1 FOR UPDATE",[id]);
  if(!order.rows.length){await client.query("ROLLBACK");begun=false;return Response.json({error:"Objednávka nenalezena."},{status:404});}
  if(!String(order.rows[0].service).startsWith("packeta-")){await client.query("ROLLBACK");begun=false;return Response.json({error:"Tato objednávka není pro Zásilkovnu."},{status:409});}
  if(["cancelled","completed","shipped"].includes(String(order.rows[0].status))){await client.query("ROLLBACK");begun=false;return Response.json({error:"U uzavřené či odeslané objednávky nelze přepisovat zásilku."},{status:409});}
  const old=await client.query("SELECT handed_over_at FROM order_shipments WHERE order_id=$1 FOR UPDATE",[id]);
  if(old.rows[0]?.handed_over_at){await client.query("ROLLBACK");begun=false;return Response.json({error:"Předanou zásilku nelze přepisovat."},{status:409});}
  await client.query(`INSERT INTO order_shipments(order_id,carrier,external_tracking_code,weight_grams,dispatch_note)
   VALUES ($1,'packeta',$2,$3,$4)
   ON CONFLICT (order_id) DO UPDATE SET external_tracking_code=excluded.external_tracking_code,
   weight_grams=excluded.weight_grams,dispatch_note=excluded.dispatch_note,updated_at=NOW()
   WHERE order_shipments.handed_over_at IS NULL`,[id,input.trackingCode,input.weightGrams,input.note]);
  await client.query("COMMIT");begun=false;
  return Response.json({saved:true,message:"Číslo zásilky uloženo. Předání na podacím místě je nutné potvrdit samostatně."});
 }catch(e){if(begun)await client.query("ROLLBACK");console.error("Shipment prepare",e);return Response.json({error:"Zásilku nelze uložit."},{status:503});}
 finally{client.release();}
}
