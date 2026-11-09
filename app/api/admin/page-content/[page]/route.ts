import {createHash} from "node:crypto";
import {z} from "zod";
import {database,guard,failure} from "@/lib/server";
import {editablePageIdSchema,pageDocumentSchema,pageSettingKey} from "@/lib/editable-page-content";
export const dynamic="force-dynamic";
type Context={params:Promise<{page:string}>};
const getId=async (context:Context)=>editablePageIdSchema.parse((await context.params).page);
const headers={"Cache-Control":"private, no-store"};
export async function GET(_request:Request,context:Context){
 try{
  const denied=await guard();if(denied)return denied;
  const id=await getId(context);
  const row=await database().prepare("SELECT value FROM settings WHERE key=$1").bind(pageSettingKey(id)).first<{value:string}>();
  const document=row?pageDocumentSchema.parse(JSON.parse(row.value)):null;
  return Response.json({document,version:row?createHash("md5").update(row.value).digest("hex"):null},{headers});
 }catch(e){return failure(e);}
}
export async function PUT(request:Request,context:Context){
 try{
  const denied=await guard(request);if(denied)return denied;
  const id=await getId(context);
  const raw=await request.text();
  if(raw.length>200000)return Response.json({error:"Dokument je příliš dlouhý."},{status:413,headers});
  const {document,version}=z.object({
   document:pageDocumentSchema,
   version:z.string().regex(/^[a-f0-9]{32}$/).nullable()
  }).strict().parse(JSON.parse(raw));
  const value=JSON.stringify(document);
  const db=database();
  const result=version===null
   ? await db.prepare("INSERT INTO settings (key,value) VALUES ($1,$2) ON CONFLICT DO NOTHING").bind(pageSettingKey(id),value).run()
   : await db.prepare("UPDATE settings SET value=$1 WHERE key=$2 AND md5(value)=$3").bind(value,pageSettingKey(id),version).run();
  if(!result.meta.changes)return Response.json({error:"Stránka byla mezitím upravena. Obnovte editor a zkontrolujte změny."},{status:409,headers});
  return Response.json({saved:true,version:createHash("md5").update(value).digest("hex")},{headers});
 }catch(e){
  if(e instanceof z.ZodError||e instanceof SyntaxError)return Response.json({error:"Zkontrolujte délku a formát textů, odkazů a nadpisů."},{status:400,headers});
  return failure(e);
 }
}
export async function DELETE(request:Request,context:Context){
 try{
  const denied=await guard(request);if(denied)return denied;
  const id=await getId(context);
  const {version}=z.object({version:z.string().regex(/^[a-f0-9]{32}$/)}).parse(await request.json());
  const result=await database().prepare("DELETE FROM settings WHERE key=$1 AND md5(value)=$2").bind(pageSettingKey(id),version).run();
  if(!result.meta.changes)return Response.json({error:"Stránka byla změněna. Obnovte editor."},{status:409,headers});
  return Response.json({restored:true},{headers});
 }catch(e){if(e instanceof z.ZodError)return Response.json({error:"Neplatná verze stránky."},{status:400,headers});return failure(e);}
}
