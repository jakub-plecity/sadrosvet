import {database,guard,readCategories,failure} from "@/lib/server";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(){try{return Response.json({categories:await readCategories()},{headers:{"Cache-Control":"no-store"}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const denied=await guard(request);if(denied)return denied;
 const input=z.object({name:z.string().trim().min(1).max(60)}).parse(await request.json());
 const name=input.name.normalize("NFC").replace(/\s+/g," ");
 const normalized=name.toLocaleLowerCase("cs-CZ");
 const categories=await readCategories();
 if(categories.some(c=>c.normalize("NFC").toLocaleLowerCase("cs-CZ")===normalized))return Response.json({error:"Tato kategorie už existuje."},{status:409});
 const result=await database().prepare("INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING").bind("category:"+normalized,name).run();
 if(!result.meta.changes)return Response.json({error:"Tato kategorie už existuje."},{status:409});
 return Response.json({name},{status:201});
}catch(e){if(e instanceof z.ZodError)return Response.json({error:"Zadej název kategorie o délce 1 až 60 znaků."},{status:400});return failure(e);}}
