import {getDatabase} from "../../lib/database-pool.mjs";
// Retry missed Comgate callbacks without trusting client redirects or altering orders blindly.
export const config={schedule:"*/15 * * * *"};
export default async function(){
 if(process.env.DATABASE_MAINTENANCE==="true")return;
 if(process.env.ENABLE_REAL_CHECKOUT!=="true"||!process.env.COMGATE_MERCHANT)return;
 const site=process.env.SITE_ORIGIN;
 if(site!=="https://sadrosvet.cz")return;
 const pool=getDatabase().pool;
 for(let i=0;i<10;i++){
  const client=await pool.connect();
  let payment;
  try{
   await client.query("BEGIN");
   const found=await client.query(`SELECT id,trans_id FROM comgate_payments
    WHERE state IN ('created','pending') AND trans_id IS NOT NULL
    AND created_at<NOW()-INTERVAL '3 minutes'
    AND created_at>NOW()-INTERVAL '7 days'
    AND (last_checked_at IS NULL OR last_checked_at<NOW()-INTERVAL '15 minutes')
    ORDER BY COALESCE(last_checked_at,created_at) ASC
    FOR UPDATE SKIP LOCKED LIMIT 1`);
   payment=found.rows[0];
   if(payment)await client.query("UPDATE comgate_payments SET last_checked_at=NOW() WHERE id=$1",[payment.id]);
   await client.query("COMMIT");
  }catch(error){
   await client.query("ROLLBACK").catch(()=>{});
   console.error("Comgate reconciliation claim failed",error);
   break;
  }finally{client.release()}
  if(!payment)break;
  try{
   const response=await fetch(site+"/api/comgate/notify",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({merchant:process.env.COMGATE_MERCHANT,transId:String(payment.trans_id),status:"RECONCILIATION"}),
    signal:AbortSignal.timeout(15000),cache:"no-store"
   });
   if(!response.ok)console.error("Comgate reconciliation callback rejected",response.status);
  }catch(error){console.error("Comgate reconciliation network failure",error)}
 }
}
