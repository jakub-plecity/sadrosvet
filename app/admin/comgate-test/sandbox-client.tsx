"use client";
import {useState} from "react";
type Created={paymentUrl:string;transactionId:string;refId:string;amountMinor:number;error?:string};
export default function SandboxClient(){
 const [busy,setBusy]=useState(false);
 const [created,setCreated]=useState<Created|null>(null);
 const [error,setError]=useState("");
 async function make(){
  if(busy||created)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/admin/comgate-sandbox",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error??"Test se nepodařil.");
   if(typeof data.paymentUrl!=="string"||!new URL(data.paymentUrl).hostname.endsWith(".comgate.cz"))throw new Error("Neplatný odkaz na bránu.");
   setCreated(data);
  }catch(e){setError(e instanceof Error?e.message:"Test se nepodařil.");}finally{setBusy(false)}
 }
 return <section style={{margin:"1.5rem 0"}}>
  <button type="button" onClick={make} disabled={busy||!!created} style={{padding:".8rem 1.1rem",borderRadius:8,border:"1px solid currentColor",cursor:"pointer"}}>{busy?"Vytvářím test…":"Vytvořit testovací platbu 10 Kč"}</button>
  {error&&<p role="alert">{error}</p>}
  {created&&<div role="status"><p>Testovací transakce vytvořena: <strong>{created.transactionId}</strong></p>
   <p>Reference: {created.refId}</p>
   <p><a href={created.paymentUrl} target="_blank" rel="noopener noreferrer">Otevřít testovací platbu Comgate</a></p>
   <p>Odkaz neznamená potvrzení zaplacení. Výsledek ověříme odděleně.</p>
  </div>}
 </section>
}
