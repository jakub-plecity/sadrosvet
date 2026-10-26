import {guard} from "@/lib/server";
import {getDatabase} from "../../../../lib/database-pool.mjs";
import {comgateConfigured} from "@/lib/comgate";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await guard();if(denied)return denied;
 const headers={"Cache-Control":"private, no-store"};
 const base={
  credentialsPresent:comgateConfigured(),
  realOrdersEnabled:process.env.ENABLE_REAL_CHECKOUT==="true",
  comgateTestMode:process.env.COMGATE_TEST!=="false",
  publicComgateEnabled:false,
  readyForLive:false,
  reason:"Platby zákazníků zůstávají blokované před závěrečným integračním testem."
 };
 try{
  const result=await getDatabase().pool.query(
   "SELECT COUNT(*)::int AS pending FROM comgate_payments WHERE state IN ('created','pending')");
  const orders=await getDatabase().pool.query(
   "SELECT COUNT(*)::int AS unpaid FROM customer_orders WHERE payment_method='comgate' AND payment_status='unpaid' AND status<>'cancelled'");
  return Response.json({...base,databaseAccessible:true,pendingPayments:Number(result.rows[0].pending),unpaidOrders:Number(orders.rows[0].unpaid)},{headers});
 }catch(error){
  console.error("Comgate launch audit DB failed",error);
  return Response.json({...base,databaseAccessible:false,error:"Databázi plateb se nepodařilo ověřit."},{status:503,headers});
 }
}
