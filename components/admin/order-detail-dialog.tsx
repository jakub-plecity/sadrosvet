"use client";
import {useEffect,useState} from "react";
import {Dialog,DialogContent,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {MapPin,Phone,Mail,Package,Wallet,Truck,UserRound,CalendarDays,FileText,ExternalLink} from "lucide-react";
import {OrderStatus} from "@/components/admin/order-status";
import {orderStateLabel,paymentMethodLabel,paymentStatusLabel,type OrderState} from "@/lib/admin-order-labels";
import {shippingServices} from "@/lib/checkout";
import {money} from "@/lib/catalog";

type Address={street?:string;house?:string;city?:string;zip?:string};
type Pickup={id?:string;name?:string;address?:string;zip?:string};
type Company={name?:string;ico?:string;dic?:string};
type OrderItem={product_id:string|null;name:string;quantity:number;unit_price_minor:number};
type OrderDetail={
 id:string;order_number:string;created_at:string;updated_at:string|null;
 customer_name:string;customer_email:string;customer_phone:string;customer_note:string|null;
 shipping_address:Address|null;billing_address:Address|null;pickup_point:Pickup|null;company:Company|null;
 service:string;payment_method:string;payment_status:string;status:string;
 subtotal_minor:number;shipping_minor:number;cod_minor:number;total_minor:number;
 items:OrderItem[];shipment:{external_tracking_code:string|null;handed_over_at:string|null}|null
};
function structured<T>(input:T|string|null|undefined):T|null{
 if(input===null||input===undefined||input==="")return null;
 if(typeof input!=="string")return input;
 try{return JSON.parse(input) as T;}catch{return null;}
}
const addressText=(value:Address|null)=>value?[ [value.street,value.house].filter(Boolean).join(" "),[value.zip,value.city].filter(Boolean).join(" ")].filter(Boolean).join(", "):"Neuvedena";
const formatDate=(value:string|null|undefined)=>value?new Date(value).toLocaleString("cs-CZ",{timeZone:"Europe/Prague"}):"Neuvedeno";
const none=(value:string|null|undefined)=>value?.trim()?value:"Neuvedeno";
const cleanPhone=(value:string)=>value.replace(/[^+0-9]/g,"");
function Field({label,children}:{label:string;children:React.ReactNode}){return <div className="admin-order-detail-field"><dt>{label}</dt><dd>{children}</dd></div>;}
function Section({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <section className="admin-order-detail-card"><h3>{icon}{title}</h3><dl>{children}</dl></section>;}
export function OrderDetailDialog({id,onClose,onStatusChanged}:{id:string|null;onClose:()=>void;onStatusChanged:()=>void}){
 const [order,setOrder]=useState<OrderDetail|null>(null);
 const [loading,setLoading]=useState(false),[error,setError]=useState("");
 useEffect(()=>{
  if(!id){setOrder(null);setError("");return;}
  const controller=new AbortController();
  setOrder(null);setError("");setLoading(true);
  fetch("/api/admin/real-orders/"+encodeURIComponent(id),{cache:"no-store",signal:controller.signal}).then(async res=>{
   const data=await res.json() as {order?:OrderDetail;error?:string};
   if(!res.ok||!data.order)throw new Error(data.error??"Detail objednávky nelze načíst.");
   setOrder(data.order);
  }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Detail objednávky nelze načíst.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[id]);
 const shipping=structured<Address>(order?.shipping_address);
 const billing=structured<Address>(order?.billing_address);
 const point=structured<Pickup>(order?.pickup_point);
 const company=structured<Company>(order?.company);
 const carrier=shippingServices.find(s=>s.id===order?.service);
 const email=order?.customer_email?.trim()??"";
 const phone=order?.customer_phone?.trim()??"";
 return <Dialog open={!!id} onOpenChange={open=>{if(!open)onClose();}}>
  <DialogContent className="admin-order-detail-dialog">
   <div className="admin-order-detail-header">
    <DialogTitle>Objednávka {order?.order_number??""}</DialogTitle>
    <DialogDescription>Úplný přehled zákazníka, dopravy, platby, zakoupených položek a průběhu objednávky. Přístupné pouze správci obchodu.</DialogDescription>
   </div>
   {loading&&<p className="notice">Načítám detail objednávky…</p>}
   {error&&<p role="alert" className="error">{error}</p>}
   {order&&!loading&&<div className="admin-order-detail-scroll">
    <div className="admin-order-detail-summary">
     <span><CalendarDays size={16}/> Vytvořeno: {formatDate(order.created_at)}</span>
     <strong>{money(order.total_minor)}</strong>
     <span>{orderStateLabel(order.status)}</span>
    </div>
    <div className="admin-order-detail-grid">
     <Section title="Zákazník" icon={<UserRound size={19}/>}>
      <Field label="Jméno">{none(order.customer_name)}</Field>
      <Field label="Telefon">{phone?<a href={"tel:"+cleanPhone(phone)}><Phone size={14}/>{phone}</a>:"Neuvedeno"}</Field>
      <Field label="E-mail">{email?<a href={"mailto:"+email}><Mail size={14}/>{email}</a>:"Neuvedeno"}</Field>
      {company&&<><Field label="Firma">{none(company.name)}</Field><Field label="IČO">{none(company.ico)}</Field><Field label="DIČ">{none(company.dic)}</Field></>}
     </Section>
     <Section title="Doručení" icon={<Truck size={19}/>}>
      <Field label="Způsob doručení">{carrier?carrier.carrier+" – "+carrier.label:order.service}</Field>
      <Field label="Doručovací adresa">{shipping?addressText(shipping):order.service==="personal-pickup"?"Osobní odběr – Na Kopci 1083, Chrudim":point?"Doručení na výdejní místo":"Neuvedena"}</Field>
      {point&&<><Field label="Výdejní místo">{none(point.name)}</Field><Field label="Adresa výdejního místa">{[point.address,point.zip].filter(Boolean).join(", ")||"Neuvedena"}</Field><Field label="ID výdejního místa">{none(point.id)}</Field></>}
      <Field label="Fakturační adresa">{addressText(billing)}</Field>
      {order.shipment&&<><Field label="Sledovací číslo">{none(order.shipment.external_tracking_code)}</Field><Field label="Předáno dopravci">{formatDate(order.shipment.handed_over_at)}</Field></>}
     </Section>
     <Section title="Platba a částky" icon={<Wallet size={19}/>}>
      <Field label="Způsob platby">{paymentMethodLabel(order.payment_method)}</Field>
      <Field label="Stav platby">{paymentStatusLabel(order.payment_status)}</Field>
      <Field label="Cena produktů">{money(order.subtotal_minor)}</Field>
      <Field label="Doprava">{money(order.shipping_minor)}</Field>
      <Field label="Příplatek za dobírku">{money(order.cod_minor)}</Field>
      <Field label="Celkem"><strong>{money(order.total_minor)}</strong></Field>
     </Section>
     <Section title="Identifikace a poznámky" icon={<FileText size={19}/>}>
      <Field label="Číslo objednávky">{order.order_number}</Field>
      <Field label="Interní ID"><code className="admin-order-id">{order.id}</code></Field>
      <Field label="Datum poslední změny">{formatDate(order.updated_at)}</Field>
      <Field label="Poznámka zákazníka"><span className="admin-order-note">{none(order.customer_note)}</span></Field>
     </Section>
    </div>
    <section className="admin-order-detail-card admin-order-detail-products">
     <h3><Package size={19}/> Zakoupené položky</h3>
     <div className="admin-order-detail-table"><table><thead><tr><th>Produkt</th><th>Počet</th><th>Cena za kus</th><th>Mezisoučet</th></tr></thead><tbody>
      {order.items.map((item,i)=><tr key={item.product_id??i}><td>{item.name||"Neznámý produkt"}</td><td>{item.quantity} ks</td><td>{money(item.unit_price_minor)}</td><td>{money(item.unit_price_minor*item.quantity)}</td></tr>)}
     </tbody></table></div>
    </section>
    <section className="admin-order-detail-card">
     <h3><ExternalLink size={19}/> Průběh objednávky</h3>
     <p className="admin-order-detail-help">Níže můžete změnit stav objednávky. Nabídka zobrazuje pouze následující povolené kroky.</p>
     <OrderStatus key={order.id+":"+order.status} id={order.id} status={order.status as OrderState} onUpdated={status=>{setOrder(current=>current?{...current,status}:current);onStatusChanged();}}/>
    </section>
   </div>}
  </DialogContent>
 </Dialog>;
}
