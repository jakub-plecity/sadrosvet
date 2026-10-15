import {guard,database} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){
 const denied=await guard();if(denied)return denied;
 try{
  const db=database();
  const {results}=await db.prepare(`SELECT o.id,o.order_number,o.status,o.payment_method,o.payment_status,o.service,
   o.customer_name,o.customer_email,o.customer_phone,o.shipping_address,o.billing_address,o.pickup_point,
   o.customer_note,o.subtotal_minor,o.shipping_minor,o.cod_minor,o.total_minor,o.created_at,
   COALESCE(json_agg(json_build_object('productId',i.product_id,'name',i.name,
   'quantity',i.quantity,'unitPriceMinor',i.unit_price_minor)) FILTER (WHERE i.product_id IS NOT NULL),'[]') AS items
   FROM customer_orders o
   LEFT JOIN customer_order_items i ON i.order_id=o.id
   GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`).all();
  return Response.json({orders:results},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){console.error("Admin orders",e);return Response.json({error:"Objednávky se nepodařilo načíst."},{status:503});}
}
