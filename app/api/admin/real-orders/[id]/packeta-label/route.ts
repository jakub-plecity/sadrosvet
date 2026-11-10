import {guard} from "@/lib/server";
import {getDatabase} from "../../../../../../lib/database-pool.mjs";
import {packetaLabelPdf} from "@/lib/packeta-api";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(request:Request,ctx:{params:Promise<{id:string}>}){
 const denied=await guard();if(denied)return denied;
 const {id}=await ctx.params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatná objednávka."},{status:400});
 try{
  const parcel=new URL(request.url).searchParams.get("parcel");
  if(parcel!==null&&!/^[1-9]\d{0,2}$/.test(parcel))return Response.json({error:"Neplatné číslo balíku."},{status:400});
  const db=getDatabase().pool;
  const result=parcel===null
   ? await db.query("SELECT p.packet_id FROM packeta_api_operations p JOIN customer_orders o ON o.id=p.order_id WHERE p.order_id=$1 AND p.state='created' AND o.service='packeta-point'",[id])
   : await db.query("SELECT parcels -> $2::int ->> 'packetId' AS packet_id FROM packeta_auto_jobs WHERE order_id=$1",[id,Number(parcel)-1]);
  const packetId=result.rows[0]?.packet_id;
  if(!packetId)return Response.json({error:"Zásilka nebyla vytvořena přes API."},{status:404});
  const pdf=await packetaLabelPdf(String(packetId));
  return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="sadrosvet-packeta-stitek.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){console.error("Packeta label unavailable",id,e instanceof Error?e.name:"error");return Response.json({error:"Štítek se nepodařilo stáhnout. Zkontroluj zásilku v Zásilkovně."},{status:502});}
}
