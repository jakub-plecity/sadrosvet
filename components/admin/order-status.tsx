"use client";
import {useState} from "react";
type Status="pending"|"confirmed"|"processing"|"shipped"|"ready_for_pickup"|"completed"|"cancelled";
const options:Record<Status,Status[]>={pending:["confirmed","cancelled"],confirmed:["processing","cancelled"],processing:["shipped","ready_for_pickup","cancelled"],shipped:["completed"],ready_for_pickup:["completed","cancelled"],completed:[],cancelled:[]};
export function OrderStatus({id,status}:{id:string,status:Status}){
 const [current,setCurrent]=useState(status),[next,setNext]=useState<Status| "">(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const allowed=options[current]??[];
 async function save(){
  if(!next||busy)return;
  if(next==="cancelled"&&!window.confirm("Stornovat objednávku a vrátit kusy do skladu?"))return;
  setBusy(true);setMessage("");
  try{const r=await fetch("/api/admin/real-orders/"+encodeURIComponent(id),{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:next})});const d=await r.json();if(!r.ok)throw Error(d.error??"Chyba.");setCurrent(d.status);setNext("");setMessage("Uloženo.");}catch(e){setMessage(e instanceof Error?e.message:"Nelze uložit.");}finally{setBusy(false);}
 }
 return <div><span>{current}</span> {allowed.length>0&&<><select aria-label="Nový stav" value={next} disabled={busy} onChange={e=>setNext(e.target.value as Status| "")}><option value="">Změnit stav</option>{allowed.map(v=><option key={v} value={v}>{v}</option>)}</select><button type="button" disabled={!next||busy} onClick={save}>Uložit</button></>}{message&&<small role="status">{message}</small>}</div>;
}
