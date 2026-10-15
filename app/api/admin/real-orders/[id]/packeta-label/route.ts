import {guard} from "@/lib/server";
import {getDatabase} from "@netlify/database";
import {packetaLabelPdf} from "@/lib/packeta-api";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(_request:Request,ctx:{params:Promise<{id:string}>}){
 const denied=await guard();if(denied)return denied;
 const {id}=await ctx.params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatná objednávka."},{status:400});
 try{
  const result=await getDatabase().pool.query("SELECT packet_id FROM packeta_api_operations WHERE order_id=$1 AND state='created'",[id]);
  const packetId=result.rows[0]?.packet_id;
  if(!packetId)return Response.json({error:"Zásilka nebyla vytvořena přes API."},{status:404});
  const pdf=await packetaLabelPdf(String(packetId));
  return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":'inline; filename="sadrosvet-packeta-stitek.pdf"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){console.error("Packeta label unavailable",id,e instanceof Error?e.name:"error");return Response.json({error:"Štítek se nepodařilo stáhnout. Zkontroluj zásilku v Zásilkovně."},{status:502});}
}
