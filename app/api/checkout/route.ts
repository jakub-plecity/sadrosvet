import {realOrderInput} from "@/lib/order-input";
import {createRealOrder,OrderConflict,OrderUnavailable} from "@/lib/order-transactions";
import {z} from "zod";
import {beginComgatePayment} from "@/lib/comgate-order";
import {comgateConfigured} from "@/lib/comgate";
export const dynamic="force-dynamic";
const onlineEnabled=()=>process.env.ENABLE_REAL_CHECKOUT==="true"&&process.env.ENABLE_COMGATE_CHECKOUT==="true"&&process.env.COMGATE_TEST==="false"&&comgateConfigured();
export async function GET(){return Response.json({enabled:process.env.ENABLE_REAL_CHECKOUT==="true",comgateTestEnabled:onlineEnabled()},{headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
 // Merchant-controlled launch switch; public orders are enabled only after deployment configuration.
 if(process.env.ENABLE_REAL_CHECKOUT!=="true")return Response.json({error:"Skutečné objednávky zatím nejsou aktivní."},{status:503});
 const current=new URL(request.url).origin;
 if(request.headers.get("origin")!==current)
  return Response.json({error:"Neplatný původ požadavku."},{status:403});
 try{
  const raw=await request.text();
  if(raw.length>16000)return Response.json({error:"Příliš velký požadavek."},{status:413});
  const input=realOrderInput.parse(JSON.parse(raw));
  const canonical=JSON.stringify(input);
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
  const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,"0")).join("");
  if(input.delivery.payment==="comgate"&&!onlineEnabled())
   return Response.json({error:"Online platba je zatím vypnutá."},{status:503});
  const created=await createRealOrder(input,hash);
  if(input.delivery.payment==="comgate"){
   // The same order UUID and request hash make checkout retries idempotent.
   // A failed or ambiguous API creation deliberately leaves the order for manual review;
   // never create another Comgate transaction automatically.
   const payment=await beginComgatePayment(input.id);
   return Response.json({...created,real:true,paymentRedirect:payment.redirect},{status:created.duplicate?200:201,headers:{"Cache-Control":"no-store"}});
  }
  return Response.json({...created,real:true},{status:created.duplicate?200:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  if(e instanceof z.ZodError||e instanceof SyntaxError)return Response.json({error:"Zkontrolujte údaje objednávky."},{status:400});
  if(e instanceof OrderConflict)return Response.json({error:e.message},{status:409});
  if(e instanceof OrderUnavailable)return Response.json({error:e.message},{status:409});
  console.error("Checkout failed",e);
  return Response.json({error:"Objednávku se nepodařilo potvrdit. Před opakováním zkontrolujte její stav."},{status:503});
 }
}
