import {guard} from "@/lib/server";
import {cachePolicy,invalidatePublicCache} from "@/lib/public-cache";
export const dynamic="force-dynamic";
const privateHeaders={"Cache-Control":"private, no-store"};
export async function GET(){
 const denied=await guard();if(denied)return denied;
 return Response.json({policy:cachePolicy,scope:"public",note:"Administrace, objednávky, platby a návštěvnost se necachují."},{headers:privateHeaders});
}
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 let body:unknown;
 try{body=await request.json();}catch{return Response.json({error:"Neplatný požadavek."},{status:400,headers:privateHeaders});}
 const scope=(body as {scope?:unknown}|null)?.scope;
 if(scope!=="products"&&scope!=="categories"&&scope!=="all")return Response.json({error:"Neplatný rozsah cache."},{status:400,headers:privateHeaders});
 invalidatePublicCache(scope);
 return Response.json({ok:true,scope},{headers:privateHeaders});
}
