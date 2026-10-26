import {guard} from "@/lib/server";
import {getDatabase} from "../../../../lib/database-pool.mjs";
import {comgateConfigured} from "@/lib/comgate";
import {publicOnlinePaymentsEnabled} from "@/lib/payment-availability";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await guard();if(denied)return denied;
 const headers={"Cache-Control":"private, no-store"};
 const publicComgateEnabled=publicOnlinePaymentsEnabled();
 const base={credentialsPresent:comgateConfigured(),realOrdersEnabled:process.env.ENABLE_REAL_CHECKOUT==="true",comgateTestMode:process.env.COMGATE_TEST!=="false",publicComgateEnabled,readyForLive:publicComgateEnabled,reason:publicComgateEnabled?"Online platby jsou dostupné veřejnosti v ostrém režimu. Konkrétní metody určuje Comgate.":"Online platby nejsou veřejně dostupné; ověřte provozní nastavení.",emailConfigured:!!process.env.RESEND_API_KEY?.trim()&&!!process.env.ORDER_EMAIL_FROM?.trim(),databaseProvider:process.env.DATABASE_PROVIDER??"netlify"};
 try{
  const db=getDatabase().pool;
  const result=await db.query("SELECT COUNT(*)::int AS pending FROM comgate_payments WHERE state IN ('created','pending')");
  const orders=await db.query("SELECT COUNT(*)::int AS unpaid FROM customer_orders WHERE payment_method='comgate' AND payment_status='unpaid' AND status<>'cancelled'");
  const email=await db.query("SELECT COUNT(*) FILTER (WHERE status='failed')::int AS failed,COUNT(*) FILTER (WHERE status IN ('pending','sending') AND created_at<NOW()-INTERVAL '15 minutes')::int AS delayed FROM order_email_outbox");
  let backupStored:boolean|null=null;
  try{const backup=await db.query("SELECT EXISTS(SELECT 1 FROM sadrosvet_backups.exports) AS stored");backupStored=backup.rows[0].stored===true;}catch{ /* Backup visibility is reported separately from application availability. */ }
  return Response.json({...base,databaseAccessible:true,backupStored,pendingPayments:Number(result.rows[0].pending),unpaidOrders:Number(orders.rows[0].unpaid),failedEmails:Number(email.rows[0].failed),delayedEmails:Number(email.rows[0].delayed),checkedAt:new Date().toISOString()},{headers});
 }catch{
  return Response.json({...base,readyForLive:false,databaseAccessible:false,error:"Databázi se nepodařilo ověřit."},{status:503,headers});
 }
}
