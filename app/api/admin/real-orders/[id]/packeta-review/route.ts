import {guard} from "@/lib/server";
import {getDatabase} from "../../../../../../lib/database-pool.mjs";
import {z} from "zod";

const reviewSchema=z.object({
 parcel:z.number().int().min(1).max(400),
 barcode:z.string().trim().regex(/^Z[0-9]{4,20}$/).or(z.literal(""))
}).strict();

export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){
 const denied=await guard(request);if(denied)return denied;
 const {id}=await ctx.params;
 if(!z.string().uuid().safeParse(id).success)return Response.json({error:"Neplatná objednávka."},{status:400});
 let review;
 try{review=reviewSchema.parse(await request.json());}
 catch{return Response.json({error:"Zadejte platný kód zásilky nebo potvrďte, že zásilka nevznikla."},{status:400});}
 try{
  const {rows}=await getDatabase().pool.query(`UPDATE packeta_auto_jobs
   SET parcels=CASE WHEN $3='' THEN parcels ELSE jsonb_set(jsonb_set(parcels,
    ARRAY[next_parcel::text,'barcode'],to_jsonb($3::text)),ARRAY[next_parcel::text,'packetId'],to_jsonb(substr($3,2))) END,
    next_parcel=next_parcel+CASE WHEN $3='' THEN 0 ELSE 1 END,
    state=CASE WHEN $3<>'' AND next_parcel+1=jsonb_array_length(parcels) THEN 'created' ELSE 'queued' END,
    reason=NULL,updated_at=NOW()
   WHERE order_id=$1 AND state='review' AND next_parcel=$2 AND next_parcel<jsonb_array_length(parcels)
    AND ($3='' OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(parcels) p WHERE p->>'barcode'=$3))
   RETURNING order_id`,[id,review.parcel-1,review.barcode]);
  if(!rows.length)return Response.json({error:"Stav balíku se změnil nebo je kód již uložený."},{status:409});
  return Response.json({ok:true});
 }catch{
  return Response.json({error:"Výsledek kontroly se nepodařilo uložit."},{status:503});
 }
}
