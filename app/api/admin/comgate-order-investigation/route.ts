import {guard} from "@/lib/server";
import {getDatabase} from "@netlify/database";
export const dynamic="force-dynamic";
// Read-only investigation of a failed Comgate order. No inventory or payment changes.
export async function GET(request:Request){
 const denied=await guard();if(denied)return denied;
 const id=new URL(request.url).searchParams.get("orderId")??"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return Response.json({error:"Neplatné ID objednávky."},{status:400});
 const headers={"Cache-Control":"private, no-store"};
 try{
  const db=getDatabase().pool;
  const order=await db.query("SELECT id,order_number,status,payment_method,payment_status,total_minor,created_at FROM customer_orders WHERE id=$1",[id]);
  if(order.rows.length===0)return Response.json({error:"Objednávka nebyla nalezena."},{status:404,headers});
  const p=await db.query("SELECT state,trans_id,test,created_at FROM comgate_payments WHERE order_id=$1",[id]);
  const items=await db.query("SELECT i.product_id,i.name,i.quantity,p.stock AS current_stock FROM customer_order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id=$1",[id]);
  const o=order.rows[0];
  return Response.json({
   order:{id:o.id,number:String(o.order_number),status:o.status,paymentMethod:o.payment_method,paymentStatus:o.payment_status,totalMinor:o.total_minor,createdAt:o.created_at},
   paymentAttempt:p.rows.map(x=>({state:x.state,transactionId:x.trans_id,test:x.test,createdAt:x.created_at})),
   items:items.rows.map(x=>({productId:x.product_id,name:x.name,orderedQuantity:x.quantity,currentStock:x.current_stock})),
   warning:"Aktuální sklad neprokazuje historické ruční úpravy. Tento endpoint nic nemění."
  },{headers});
 }catch(e){console.error("Comgate order investigation failed",e);return Response.json({error:"Kontrolu objednávky nelze dokončit."},{status:503,headers})}
}
