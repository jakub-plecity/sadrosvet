import {guard} from "@/lib/server";
import {verifyComgatePayment} from "@/lib/comgate";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 const transId=new URL(request.url).searchParams.get("transId")??"";
 if(!/^[A-Z0-9-]{6,64}$/.test(transId))return Response.json({error:"Neplatné ID transakce."},{status:400});
 if(process.env.COMGATE_TEST!=="true")return Response.json({error:"Kontrola sandboxu je vypnuta."},{status:403});
 try{
  const result=await verifyComgatePayment(transId);
  if(!result.test||!result.refId?.startsWith("SADRO-TEST-"))
   return Response.json({error:"Tato transakce není testovací platba SádroSvět."},{status:403});
  return Response.json({transactionId:transId,status:result.status,reference:result.refId,amountMinor:result.priceMinor,currency:result.currency,test:true},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){console.error("Sandbox status failed",error instanceof Error?error.message:"Unknown");
  return Response.json({error:"Stav platby se nepodařilo ověřit u Comgate."},{status:503});
 }
}
