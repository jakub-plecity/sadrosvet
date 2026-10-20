import {database,guard,failure} from "@/lib/server";
import {z} from "zod";
export async function PUT(request:Request){try{
 const denied=await guard(request);if(denied)return denied;
 const {ids}=z.object({ids:z.array(z.string().min(1)).max(10000)}).parse(await request.json());
 if(new Set(ids).size!==ids.length)return Response.json({error:"Duplicitní identifikátory."},{status:400});
 const db=database();const {results}=await db.prepare("SELECT id FROM products").all<{id:string}>();
 if(ids.length!==results.length||results.some(row=>!ids.includes(row.id)))return Response.json({error:"Seznam produktů se změnil. Obnovte jej."},{status:409});
 await db.batch(ids.map((id,index)=>db.prepare("UPDATE products SET sort_order=$1 WHERE id=$2").bind(index,id)));
 return Response.json({success:true});
 }catch(e){return failure(e);}
}
