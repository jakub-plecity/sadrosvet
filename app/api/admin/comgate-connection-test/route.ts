import {guard} from "@/lib/server";
import {comgateConfigured,probeComgateConnection} from "@/lib/comgate";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await guard();if(denied)return denied;
 if(!comgateConfigured())return Response.json({connected:false,error:"Chybí nastavení COMGATE_MERCHANT nebo COMGATE_SECRET."},{status:503,headers:{"Cache-Control":"private, no-store"}});
 try{
  const result=await probeComgateConnection();
  return Response.json({connected:result.authenticated,availablePaymentMethods:result.availablePaymentMethods,livePaymentsEnabled:false,message:"Ověřeno připojení bez vytvoření platební transakce."},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  console.error("Comgate API connection probe failed",error instanceof Error?error.message:"Unknown error");
  return Response.json({connected:false,error:"Comgate API odmítlo nebo nedokončilo kontrolu. Zkontrolujte přihlašovací údaje a případná omezení IP."},{status:503,headers:{"Cache-Control":"private, no-store"}});
 }
}
