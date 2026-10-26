import {guard} from "@/lib/server";
import {createComgatePayment} from "@/lib/comgate";
import {getDatabase} from "../../../../lib/database-pool.mjs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(request:Request){
 const denied=await guard();if(denied)return denied;
 // Netlify can rewrite the internal Request URL to its deployment host.
 // Compare the browser Origin against the canonical public shop origin instead.
 const origin=request.headers.get("origin");
 const expected=process.env.SITE_ORIGIN?.replace(/\/$/,"")??"https://sadrosvet.cz";
 if(origin!==expected)return Response.json({error:"Požadavek nepochází z tohoto webu."},{status:403,headers});
 if(process.env.COMGATE_TEST!=="true")return Response.json({error:"Testovací režim Comgate není zapnutý. Žádná platba nebyla vytvořena."},{status:403,headers});
 // A deliberately isolated sandbox transaction: no customer order, stock reservation or email.
 // Real payment creation remains unavailable to the public.
 try{
  const refId="SADRO-TEST-"+crypto.randomUUID().replaceAll("-","").slice(0,16);
  const p=await createComgatePayment({orderNumber:refId,priceMinor:1000,email:"sadrosvet@seznam.cz",name:"SadroSvet Test",service:"balikovna-address"});
  await getDatabase().pool.query("INSERT INTO comgate_sandbox_transactions(trans_id,ref_id,amount_minor,currency,status) VALUES($1,$2,1000,'CZK','created') ON CONFLICT(trans_id) DO NOTHING",[p.transId,refId]);
  return Response.json({sandbox:true,amountMinor:1000,currency:"CZK",transactionId:p.transId,refId,paymentUrl:p.redirect,
   note:"Testovací transakce není objednávka. Nelze ji automaticky potvrdit v administraci a Comgate notifikace zatím nejsou navázané na testovací ledger."},{status:201,headers});
 }catch(error){
  console.error("Comgate isolated sandbox create",error instanceof Error?error.message:"Unknown error");
  return Response.json({error:"Testovací platbu se nepodařilo založit. Zkontrolujte technický log a Comgate."},{status:503,headers});
 }
}
export async function GET(){return Response.json({error:"Použijte administrátorské rozhraní."},{status:405,headers})}
