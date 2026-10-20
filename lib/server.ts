import "server-only";
import {database as getDatabase} from "./database";
import {imageBucket} from "./storage";
import {validAdminSession} from "./admin-session";
import { catalogCategories, type Product } from "./catalog";
import { z } from "zod";
export const runtime = () => ({SITE_ORIGIN:process.env.SITE_ORIGIN, BUCKET:imageBucket});
export const database = getDatabase;
export async function isAdmin(){return validAdminSession();}
export async function guard(request?:Request){
 if(!await isAdmin())return Response.json({error:"Do administrace nemáte přístup."},{status:403});
 if(request){const origin=request.headers.get("origin"); const trusted=runtime().SITE_ORIGIN??new URL(request.url).origin;
  if(!origin||(origin!==trusted&&origin!==new URL(request.url).origin))return Response.json({error:"Požadavek nepochází z tohoto webu."},{status:403});
 }
 return null;
}
function productImages(row:Record<string,unknown>){try{const value=JSON.parse(String(row.images??"[]"));if(Array.isArray(value)&&value.length)return value.filter(x=>typeof x==="string").slice(0,10);}catch{}return row.image?[String(row.image)]:[];}
export function mapProduct(row:Record<string,unknown>):Product{return {id:String(row.id),name:String(row.name),description:String(row.description),detailedDescription:String(row.detailed_description??""),dimensions:String(row.dimensions??""),weight:String(row.weight??""),category:String(row.category),priceMinor:Number(row.price_minor),stock:Number(row.stock),image:productImages(row)[0]??"",images:productImages(row),status:row.status as Product["status"],sample:Number(row.sample),revision:Number(row.revision),sortOrder:Number(row.sort_order??0),updatedAt:String(row.updated_at)};}
export async function readProducts(all=false){const {results}=await database().prepare(all?"SELECT * FROM products ORDER BY sort_order ASC, updated_at DESC, id":"SELECT * FROM products WHERE status='active' ORDER BY sort_order ASC, updated_at DESC, id").all();return results.map(mapProduct);}
export const productInput=z.object({name:z.string().trim().min(1).max(120),description:z.string().trim().max(3000),detailedDescription:z.string().trim().max(8000).optional().default(""),dimensions:z.string().trim().max(180).optional().default(""),weight:z.string().trim().max(100).optional().default(""),category:z.string().trim().min(1).max(60),priceMinor:z.number().int().min(100).max(100000000),stock:z.number().int().min(0).max(100000),images:z.array(z.string().regex(/^\/api\/images\/[a-z0-9-]+$|^\/collection\.png$/)).max(10).optional(),image:z.string().refine(x=>x===""||x==="/collection.png"||/^\/api\/images\/[a-z0-9-]+$/.test(x),"Nahrajte vlastní obrázek."),status:z.enum(["active","draft","archived"]),sample:z.number().int().min(0).max(1),revision:z.number().int().positive().optional()});
export function failure(error:unknown){console.error("SádroSvět API",error);if(error instanceof z.ZodError)return Response.json({error:"Zkontrolujte název, cenu, dostupnost a fotografii."},{status:400});return Response.json({error:"Údaje se nepodařilo zpracovat. Zkuste to znovu; zadané hodnoty zůstávají zachované."},{status:503});}

export async function readCategories():Promise<string[]>{
 const db=database();
 const [saved,used]=await Promise.all([
  db.prepare("SELECT value FROM settings WHERE key LIKE 'category:%' ORDER BY value").all<{value:string}>(),
  db.prepare("SELECT DISTINCT category FROM products ORDER BY category").all<{category:string}>()
 ]);
 const names=new Map<string,string>();
 for(const name of [...catalogCategories,...saved.results.map(r=>r.value),...used.results.map(r=>r.category)]){
  const clean=name.normalize("NFC").trim().replace(/\s+/g," ");
  if(clean&&!names.has(clean.toLocaleLowerCase("cs-CZ")))names.set(clean.toLocaleLowerCase("cs-CZ"),clean);
 }
 return [...names.values()];
}
