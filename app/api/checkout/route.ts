import {realOrderInput} from "@/lib/order-input";
import {createRealOrder,OrderConflict,OrderUnavailable} from "@/lib/order-transactions";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 // Deliberate kill switch: leave OFF until legal, logistics, UI and e-mail tests pass.
 if(process.env.ENABLE_REAL_CHECKOUT!=="true")return Response.json({error:"Skutečné objednávky zatím nejsou aktivní."},{status:503});
 const current=new URL(request.url).origin;
 if(request.headers.get("origin")!==current||process.env.SITE_ORIGIN!==current)
  return Response.json({error:"Neplatný původ požadavku."},{status:403});
 try{
  const raw=await request.text();
  if(raw.length>16000)return Response.json({error:"Příliš velký požadavek."},{status:413});
  const input=realOrderInput.parse(JSON.parse(raw));
  const canonical=JSON.stringify(input);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
  const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,"0")).join("");
  const created=await createRealOrder(input,hash);
  return Response.json({...created,real:true},{status:created.duplicate?200:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof z.ZodError||e instanceof SyntaxError)return Response.json({error:"Zkontrolujte údaje objednávky."},{status:400});
  if(e instanceof OrderConflict)return Response.json({error:e.message},{status:409});
  if(e instanceof OrderUnavailable)return Response.json({error:e.message},{status:409});
  console.error("Checkout failed",e);
  return Response.json({error:"Objednávku se nepodařilo potvrdit. Před opakováním zkontrolujte její stav."},{status:503});
 }
}
