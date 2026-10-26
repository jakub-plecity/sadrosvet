import {guard} from "@/lib/server";
import {getDatabase} from "../../../../lib/database-pool.mjs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 const transId=new URL(request.url).searchParams.get("transId")??"";
 if(!/^[A-Z0-9-]{6,64}$/.test(transId))
  return Response.json({error:"Neplatný identifikátor transakce."},{status:400});
 try{
  const response=await getDatabase().pool.query(
   "SELECT trans_id,ref_id,status,amount_minor,currency,created_at,verified_at FROM comgate_sandbox_transactions WHERE trans_id=$1",[transId]);
  if(!response.rows.length)
   return Response.json({found:false,notificationVerified:false,message:"Testovací transakce není v databázi."},{status:404,headers:{"Cache-Control":"private, no-store"}});
  const p=response.rows[0];
  return Response.json({found:true,transactionId:p.trans_id,reference:p.ref_id,
   recordedStatus:p.status,amountMinor:p.amount_minor,currency:p.currency,
   notificationVerified:p.verified_at!==null,verifiedAt:p.verified_at,
   note:"Výsledek pochází pouze z databáze SádroSvět, nikoliv z dotazu na Comgate. 'verifiedAt' může být nastavené jen po úspěšné notifikaci."},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  console.error("Comgate sandbox callback ledger lookup",e);
  return Response.json({error:"Databázový stav testovací platby není dostupný."},{status:503,headers:{"Cache-Control":"private, no-store"}});
 }
}
