import "server-only";
import {database} from "@/lib/database";
import {pageDocumentSchema,pageSettingKey,type EditablePageId,type PageDocument} from "@/lib/editable-page-content";

export async function readEditablePage(id:EditablePageId):Promise<PageDocument|null>{
 try{
  const row=await database().prepare("SELECT value FROM settings WHERE key=$1").bind(pageSettingKey(id)).first<{value:string}>();
  if(!row)return null;
  return pageDocumentSchema.parse(JSON.parse(row.value));
 }catch(error){
  console.error("Unable to load editable page",id,error);
  return null; // The original verified legal text remains available on database failure.
 }
}
