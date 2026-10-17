import {guard} from "@/lib/server";
import {createComgatePayment} from "@/lib/comgate";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 if(process.env.COMGATE_TEST!=="true")return Response.json({error:"Testovací režim Comgate není zapnutý. Žádná platba nebyla vytvořena."},{status:403,headers});
 // A deliberately isolated sandbox transaction: no customer order, stock reservation or email.
 // Real payment creation remains unavailable to the public.
 try{
  const refId="SADRO-TEST-"+crypto.randomUUID().replaceAll("-","").slice(0,16);
  const p=await createComgatePayment({orderNumber:refId,priceMinor:1000,email:"sadrosvet@seznam.cz",name:"SadroSvet Test",service:"balikovna-address"});
  return Response.json({sandbox:true,amountMinor:1000,currency:"CZK",transactionId:p.transId,refId,paymentUrl:p.redirect,
   note:"Testovací transakce není objednávka. Nelze ji automaticky potvrdit v administraci a Comgate notifikace zatím nejsou navázané na testovací ledger."},{status:201,headers});
 }catch(error){
  console.error("Comgate isolated sandbox create",error instanceof Error?error.message:"Unknown error");
  return Response.json({error:"Testovací platbu se nepodařilo založit. Zkontrolujte technický log a Comgate."},{status:503,headers});
 }
}
export async function GET(){return Response.json({error:"Použijte administrátorské rozhraní."},{status:405,headers})}
