"use client";
import {useState} from "react";
import {orderStatusLabels,orderTransitions,orderStateLabel,type OrderState} from "@/lib/admin-order-labels";
import {Check} from "lucide-react";

export function OrderStatus({id,status,onUpdated}:{id:string;status:OrderState;onUpdated?:(next:OrderState)=>void}){
 const [current,setCurrent]=useState<OrderState>(status);
 const [next,setNext]=useState<OrderState|"">("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const allowed=orderTransitions[current]??[];
 async function save(){
  if(!next||busy)return;
  if(next==="cancelled"&&!window.confirm("Stornovat objednávku a vrátit kusy do skladu? Tuto změnu nelze snadno vrátit."))return;
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/admin/real-orders/"+encodeURIComponent(id),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});
   const d=await r.json() as {error?:string;status?:OrderState};
   if(!r.ok||!d.status)throw Error(d.error??"Změnu stavu objednávky nelze uložit.");
   setCurrent(d.status);setNext("");setMessage("Stav byl uložen.");onUpdated?.(d.status);
  }catch(e){setMessage(e instanceof Error?e.message:"Změnu stavu nelze uložit.");}
  finally{setBusy(false);}
 }
 return <div className="admin-order-status">
  <span className={"admin-order-status-pill admin-order-state-"+current}>{orderStateLabel(current)}</span>
  {allowed.length>0&&<div className="admin-order-status-form">
   <label className="sr-only" htmlFor={"order-status-"+id}>Nový stav objednávky</label>
   <select id={"order-status-"+id} aria-label="Nový stav objednávky" value={next} disabled={busy} onChange={e=>setNext(e.target.value as OrderState|"")}>
    <option value="">Změnit stav objednávky…</option>
    {allowed.map(value=><option key={value} value={value}>{orderStatusLabels[value]}</option>)}
   </select>
   <button type="button" className="button outline" disabled={!next||busy} onClick={()=>void save()}><Check size={15}/>{busy?"Ukládám…":"Potvrdit"}</button>
  </div>}
  {message&&<small role="status">{message}</small>}
 </div>;
}
