"use client";
import {useEffect,useState} from "react";
import {money} from "@/lib/catalog";
import {RefreshCw,Search} from "lucide-react";
import {OrderStatus} from "@/components/admin/order-status";
import {OrderDetailDialog} from "@/components/admin/order-detail-dialog";
import {paymentMethodLabel,paymentStatusLabel,type OrderState} from "@/lib/admin-order-labels";
type Item={name:string;quantity:number};
type Order={
 id:string;order_number:string;created_at:string;customer_name:string;customer_email:string;customer_phone:string;
 payment_method:string;payment_status:string;status:string;total_minor:number;service:string;items:Item[]|string;
};
const itemsOf=(value:Order["items"]):Item[]=>{
 if(Array.isArray(value))return value;
 try{const parsed=JSON.parse(value);return Array.isArray(parsed)?parsed:[];}catch{return [];}
};
export function RealOrdersTable(){
 const [orders,setOrders]=useState<Order[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [query,setQuery]=useState("");
 async function refresh(silent=false){
  if(!silent)setLoading(true);setError("");
  try{
   const response=await fetch("/api/admin/real-orders",{cache:"no-store"});
   const data=await response.json() as {orders?:Order[];error?:string};
   if(!response.ok||!Array.isArray(data.orders))throw new Error(data.error||"Objednávky nelze načíst.");
   setOrders(data.orders);
  }catch(e){setError(e instanceof Error?e.message:"Objednávky nelze načíst.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void refresh();},[]);
 const filtered=orders.filter(o=>[o.order_number,o.customer_name,o.customer_email,o.customer_phone].some(v=>v?.toLocaleLowerCase("cs-CZ").includes(query.toLocaleLowerCase("cs-CZ"))));
 return <section className="admin-table admin-orders" aria-labelledby="admin-orders-heading">
  <div className="admin-orders-heading">
   <div><h3 id="admin-orders-heading">Zákaznické objednávky</h3><p>Otevřete číslo objednávky pro kompletní údaje o zákazníkovi, doručení a platbě.</p></div>
   <button type="button" className="button outline" disabled={loading} onClick={()=>void refresh()} aria-label="Obnovit objednávky" title="Obnovit objednávky"><RefreshCw size={18}/><span>Obnovit</span></button>
  </div>
  <label className="admin-orders-search"><Search size={18}/><span className="sr-only">Vyhledat objednávku</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Číslo objednávky, jméno, telefon nebo e-mail"/></label>
  {error&&<p role="alert">{error}</p>}
  {loading?<p>Načítání objednávek…</p>:<div className="admin-orders-scroll"><table>
   <thead><tr><th>Číslo objednávky</th><th>Vytvořeno</th><th>Zákazník</th><th>Kontakt</th><th>Produkty</th><th>Celkem</th><th>Platba</th><th>Průběh objednávky</th></tr></thead>
   <tbody>{filtered.map(o=><tr key={o.id}>
    <td><button className="admin-order-link" type="button" onClick={()=>setSelected(o.id)} aria-label={"Zobrazit detail objednávky "+o.order_number}>{o.order_number}</button></td>
    <td>{new Date(o.created_at).toLocaleString("cs-CZ",{timeZone:"Europe/Prague"})}</td>
    <td>{o.customer_name}</td>
    <td><div className="admin-orders-contact">{o.customer_phone?<a href={"tel:"+o.customer_phone.replace(/[^+0-9]/g,"")}>{o.customer_phone}</a>:"Telefon neuveden"}{o.customer_email?<a href={"mailto:"+o.customer_email}>{o.customer_email}</a>:"E-mail neuveden"}</div></td>
    <td>{itemsOf(o.items).map(i=>i.quantity+"× "+i.name).join(", ")}</td>
    <td><strong>{money(o.total_minor)}</strong></td>
    <td>{paymentMethodLabel(o.payment_method)}<small>{paymentStatusLabel(o.payment_status)}</small></td>
    <td><OrderStatus key={o.id+":"+o.status} id={o.id} status={o.status as OrderState} onUpdated={status=>setOrders(current=>current.map(item=>item.id===o.id?{...item,status}:item))}/></td>
   </tr>)}</tbody>
  </table>{!filtered.length&&<p className="admin-orders-empty">{query?"Žádné objednávky neodpovídají hledání.":"Žádné skutečné objednávky."}</p>}</div>}
  <OrderDetailDialog id={selected} onClose={()=>setSelected(null)} onStatusChanged={()=>void refresh(true)}/>
 </section>;
}
