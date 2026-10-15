import {isAdmin,database} from "@/lib/server";
import Link from "next/link";
import {OrderStatus} from "@/components/admin/order-status";
export const dynamic="force-dynamic";
export const metadata={title:"Objednávky · Administrace SádroSvět"};
type Order={id:string;order_number:string;status:string;customer_name:string;customer_email:string;service:string;total_minor:number;created_at:string};
export default async function OrdersPage(){
 if(!await isAdmin())return <main style={{padding:32}}><h1>Přístup odepřen</h1><p>Nejprve se přihlas do administrace.</p><Link href="/admin">Přihlášení</Link></main>;
 let orders:Order[]=[];let error="";let emailCounts:{status:string;count:number}[]=[];
 try{const rows=await database().prepare("SELECT id,order_number,status,customer_name,customer_email,service,total_minor,created_at FROM customer_orders ORDER BY created_at DESC LIMIT 100").all<Order>();orders=rows.results;
  const email=await database().prepare("SELECT status,COUNT(*)::int AS count FROM order_email_outbox GROUP BY status").all<{status:string;count:number}>();
  emailCounts=email.results;
 }catch{error="Objednávky nelze načíst. Ověř databázové migrace.";}
 return <main style={{maxWidth:1100,margin:"auto",padding:24}}>
  <p><Link href="/admin">← Administrace</Link></p>
  <h1>Skutečné objednávky</h1>
  <p>Tyto objednávky jsou oddělené od zkušebního košíku. Dokud není ostrý prodej aktivován, zůstává seznam prázdný.</p><p role="status">Potvrzovací e-maily: {emailCounts.length?emailCounts.map(x=>`${x.status}: ${x.count}`).join(" · "):"Žádné záznamy"}. Neodeslané a chybové zprávy je nutné řešit před expedicí.</p>
  {error?<p role="alert">{error}</p>:orders.length===0?<p>Žádné skutečné objednávky.</p>:
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}>
    <thead><tr>{["Číslo","Datum","Zákazník","E-mail","Doprava","Stav","Celkem"].map(x=><th key={x} style={{padding:8,textAlign:"left"}}>{x}</th>)}</tr></thead>
    <tbody>{orders.map(o=><tr key={o.id}>
     <td style={{padding:8}}>{o.order_number}</td><td style={{padding:8}}>{new Date(o.created_at).toLocaleString("cs-CZ")}</td>
     <td style={{padding:8}}>{o.customer_name}</td><td style={{padding:8}}>{o.customer_email}</td>
     <td style={{padding:8}}>{o.service}</td><td style={{padding:8}}><OrderStatus id={o.id} status={o.status as "pending"|"confirmed"|"processing"|"shipped"|"ready_for_pickup"|"completed"|"cancelled"}/></td>
     <td style={{padding:8}}>{(o.total_minor/100).toLocaleString("cs-CZ",{style:"currency",currency:"CZK"})}</td>
    </tr>)}</tbody></table></div>}
 </main>;
}
