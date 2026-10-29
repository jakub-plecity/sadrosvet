import "server-only";
import {createHash} from "node:crypto";
import {database} from "./database";
export const imageBucket = {
 async put(key:string,bytes:Uint8Array,options:{httpMetadata:{contentType:string}}){
  await database().prepare("INSERT INTO photo_objects(key,bytes,content_type,sha256,size_bytes) VALUES($1,$2,$3,$4,$5)").bind(key,Buffer.from(bytes),options.httpMetadata.contentType,createHash('sha256').update(bytes).digest('hex'),bytes.byteLength).run();
 },
 async get(key:string){
  const file=await database().prepare("SELECT bytes,content_type FROM photo_objects WHERE key=$1").bind(key).first();
  if(!file)return null;
  return {body:Uint8Array.from(file.bytes as Uint8Array).buffer,httpMetadata:{contentType:String(file.content_type)}};
 },
 async delete(key:string){await database().prepare("DELETE FROM photo_objects WHERE key=$1").bind(key).run();}
};
export type ImageBucket=typeof imageBucket;
