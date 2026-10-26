"use client";
import {useEffect,useState} from "react";
import {money} from "@/lib/catalog";
import {RefreshCw} from "lucide-react";
import {OrderStatus} from "@/components/admin/order-status";
type Item={name:string;quantity:number};
type Order={
 id:string;order_number:string;created_at:string;customer_name:string;customer_email:string;customer_phone:string;
 payment_method:string;payment_status:string;status:string;
 total_minor:number;service:string;items:Item[]|string;
};
export function RealOrdersTable(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 async function refresh(){
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/real-orders",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok||!Array.isArray(data.orders))throw new Error(data.error||"Objednávky nelze načíst.");
   setOrders(data.orders);
  }catch(e){setError(e instanceof Error?e.message:"Objednávky nelze načíst.");}
  finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[]);
 return <section className="admin-table">
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap",marginBottom:"1rem"}}>
   <h3>Skutečné zákaznické objednávky</h3>
   <button type="button" className="button outline" disabled={loading} onClick={()=>void refresh()} aria-label="Obnovit objednávky" title="Obnovit objednávky" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"0.6rem"}}><RefreshCw size={18} aria-hidden="true"/></button>
  </div>
  {error&&<p role="alert">{error}</p>}
  {loading?<p>Načítání objednávek…</p>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
   <thead><tr><th>Číslo</th><th>Vytvořeno</th><th>Zákazník</th><th>Telefon</th><th>E-mail</th><th>Produkty</th><th>Celkem</th><th>Platba</th><th>Stav objednávky</th></tr></thead>
   <tbody>{orders.map(o=><tr key={o.id}>
    <td><strong>{o.order_number}</strong></td>
    <td>{new Date(o.created_at).toLocaleString("cs-CZ")}</td>
    <td>{o.customer_name}</td>
    <td>{o.customer_phone?<a href={`tel:${o.customer_phone.replace(/[^+0-9]/g,"")}`}>{o.customer_phone}</a>:"Neuvedeno"}</td>
    <td>{o.customer_email?<a href={`mailto:${o.customer_email}`}>{o.customer_email}</a>:"Neuvedeno"}</td>
    <td>{(typeof o.items==="string"?JSON.parse(o.items) as Item[]:o.items).map(i=>i.quantity+"× "+i.name).join(", ")}</td>
    <td>{money(o.total_minor)}</td>
    <td>{o.payment_method==="comgate"?"Comgate":o.payment_method==="cod"?"Dobírka":"Hotově"} — {o.payment_status==="paid"?"Zaplaceno":"Nezaplaceno"}</td>
    <td><OrderStatus key={o.id+":"+o.status} id={o.id} status={o.status as "pending"|"confirmed"|"processing"|"shipped"|"ready_for_pickup"|"completed"|"cancelled"}/></td>
   </tr>)}</tbody>
  </table>{!orders.length&&<p>Žádné skutečné objednávky.</p>}</div>}
 </section>
}
