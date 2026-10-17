import {guard} from "@/lib/server";
import {comgateConfigured,probeComgateConnection} from "@/lib/comgate";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await guard();if(denied)return denied;
 if(!comgateConfigured())return Response.json({connected:false,error:"Chybí nastavení COMGATE_MERCHANT nebo COMGATE_SECRET."},{status:503,headers:{"Cache-Control":"private, no-store"}});
 try{
  const result=await probeComgateConnection();
  return Response.json({connected:result.connected,diagnostic:result.diagnostic,availablePaymentMethods:result.methods,livePaymentsEnabled:false,message:result.connected?"Ověřeno připojení bez vytvoření platby.":"Kontrola se nezdařila. Diagnostický kód neobsahuje tajné údaje."},{status:result.connected?200:503,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("Comgate API connection probe failed",error instanceof Error?error.message:"Unknown error");
  return Response.json({connected:false,error:"Comgate API odmítlo nebo nedokončilo kontrolu. Zkontrolujte přihlašovací údaje a případná omezení IP."},{status:503,headers:{"Cache-Control":"private, no-store"}});
 }
}
