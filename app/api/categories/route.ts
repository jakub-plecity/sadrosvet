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
 const db=database();
 const saved=await db.prepare("SELECT key FROM settings WHERE key=$1").bind("category:"+normalized).first();
 if(saved)return Response.json({error:"Tato kategorie už existuje."},{status:409});
 await db.batch([
  db.prepare("DELETE FROM settings WHERE key=$1").bind("category-hidden:"+normalized),
  db.prepare("INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING").bind("category:"+normalized,name)
 ]);
 return Response.json({name},{status:201});
}catch(e){if(e instanceof z.ZodError)return Response.json({error:"Zadej název kategorie o délce 1 až 60 znaků."},{status:400});return failure(e);}}

export async function DELETE(request:Request){try{
 const denied=await guard(request);if(denied)return denied;
 const input=z.object({name:z.string().trim().min(1).max(60)}).parse(await request.json());
 const name=input.name.normalize("NFC").replace(/\s+/g," ");
 const normalized=name.toLocaleLowerCase("cs-CZ");
 const categories=await readCategories();
 if(!categories.some(c=>c.normalize("NFC").toLocaleLowerCase("cs-CZ")===normalized))return Response.json({error:"Kategorie neexistuje."},{status:404});
 const db=database();
 const {results}=await db.prepare("SELECT id FROM products WHERE lower(trim(category))=lower($1) LIMIT 1").bind(name).all<{id:string}>();
 if(results.length)return Response.json({error:"Kategorii používají produkty (včetně konceptů a archivovaných). Nejprve je přesuňte do jiné kategorie."},{status:409});
 // Built-in categories are retained in code, so a hidden marker is required.
 // Product rows are never modified by category deletion.
 await db.batch([
  db.prepare("DELETE FROM settings WHERE key=$1").bind("category:"+normalized),
  db.prepare("INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value").bind("category-hidden:"+normalized,name)
 ]);
 return Response.json({deleted:name});
}catch(e){if(e instanceof z.ZodError)return Response.json({error:"Vyberte platnou kategorii."},{status:400});return failure(e);}}
