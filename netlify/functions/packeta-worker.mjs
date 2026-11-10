import {getDatabase} from "../../lib/database-pool.mjs";
import {createPacketaPacket} from "../../lib/packeta-transport.mjs";

export const config = {schedule:"* * * * *"};

async function claim(pool) {
 const db = await pool.connect();
 try {
  await db.query("BEGIN");
  const {rows:[job]} = await db.query(`SELECT j.order_id,j.parcels,j.next_parcel,o.order_number,o.customer_name,
   o.customer_email,o.customer_phone,o.pickup_point
   FROM packeta_auto_jobs j JOIN customer_orders o ON o.id=j.order_id
   WHERE j.state='queued' AND o.payment_status='paid' AND o.payment_method='comgate'
   AND o.service='packeta-point' AND o.status IN ('pending','confirmed','processing')
   ORDER BY j.updated_at LIMIT 1 FOR UPDATE OF o,j SKIP LOCKED`);
  if (job) await db.query("UPDATE packeta_auto_jobs SET state='creating',updated_at=NOW() WHERE order_id=$1",[job.order_id]);
  await db.query("COMMIT");
  return job;
 } catch (error) {
  await db.query("ROLLBACK");
  throw error;
 } finally {
  db.release();
 }
}

export default async function() {
 if (process.env.DATABASE_MAINTENANCE==="true" || process.env.ENABLE_REAL_CHECKOUT!=="true") return new Response(null,{status:204});
 if (!process.env.PACKETA_API_PASSWORD?.trim() || !process.env.PACKETA_SENDER_INDICATION?.trim()) return new Response(null,{status:204});
 const pool = getDatabase().pool;
 // A stopped worker may already have created a parcel. Keep the reference for manual verification.
 await pool.query(`UPDATE packeta_auto_jobs SET state='review',reason='verify-in-packeta',updated_at=NOW()
  WHERE state='creating' AND updated_at<NOW()-INTERVAL '5 minutes'`);
 const job = await claim(pool);
 if (!job) return new Response(null,{status:204});
 try {
  const parcel = job.parcels[job.next_parcel];
  const names = job.customer_name.trim().split(/\s+/);
  const surname = names.pop();
  const addressId = String(job.pickup_point?.id ?? "");
  if (!/^\d{1,12}$/.test(addressId) || !surname) throw new Error("Invalid Packeta recipient");
  const packet = await createPacketaPacket({
   number:"SS-"+job.order_number+"-"+(job.next_parcel+1), name:names.join(" ")||surname, surname,
   email:job.customer_email, phone:job.customer_phone, addressId,
   cod:0, value:parcel.valueMinor/100, weightGrams:parcel.weightGrams
  });
  parcel.packetId = packet.id;
  parcel.barcode = packet.barcode;
  const next = job.next_parcel+1;
  await pool.query(`UPDATE packeta_auto_jobs SET parcels=$2::jsonb,next_parcel=$3,state=$4,updated_at=NOW()
   WHERE order_id=$1 AND state='creating' AND next_parcel=$5`,
   [job.order_id,JSON.stringify(job.parcels),next,next===job.parcels.length?"created":"queued",job.next_parcel]);
 } catch (error) {
  await pool.query(`UPDATE packeta_auto_jobs SET state='review',reason='verify-in-packeta',updated_at=NOW()
   WHERE order_id=$1 AND state='creating' AND next_parcel=$2`,[job.order_id,job.next_parcel]);
  console.error("Packeta parcel requires review",job.order_id,job.next_parcel+1,error?.name);
 }
 return new Response(null,{status:204});
}
