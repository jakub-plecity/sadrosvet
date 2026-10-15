"use client";
import {useState} from "react";
export function PacketaShipment({orderId,tracking,grams,handedOver}:{orderId:string;tracking:string;grams:number|null;handedOver:boolean}){
 const [code,setCode]=useState(tracking),[weight,setWeight]=useState(grams?String(grams):"500"),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 return <div style={{display:"grid",gap:5,minWidth:190}}>
 <strong>Zásilkovna · osobní podání</strong>
 {handedOver?<span>Předáno dopravci · {code}</span>:<>
 <label>Číslo zásilky z klientské sekce<input value={code} maxLength={80} onChange={e=>setCode(e.target.value)} placeholder="Číslo zásilky"/></label>
 <label>Hmotnost zabaleného balíku (g)<input type="number" min={1} max={30000} value={weight} onChange={e=>setWeight(e.target.value)}/></label>
 <button type="button" disabled={busy||!code||!Number.isInteger(Number(weight))||Number(weight)<1} onClick={async()=>{
 setBusy(true);setMessage("");
 try{
 const r=await fetch("/api/admin/real-orders/"+encodeURIComponent(orderId)+"/shipment",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({trackingCode:code.trim(),weightGrams:Number(weight),note:""})});
 const data=await r.json();if(!r.ok)throw new Error(data.error??"Zásilku nelze uložit.");
 setMessage("Údaje uloženy. Po fyzickém předání změň stav na Odeslaná.");
 }catch(e){setMessage(e instanceof Error?e.message:"Chyba.");}finally{setBusy(false);}
 }}>Uložit údaje zásilky</button>
 <small>Štítek vygeneruj a vytiskni v klientské sekci Zásilkovny. Tímto tlačítkem se zásilka nevytváří.</small>
 {message&&<small role="status">{message}</small>}
 </>}
 </div>;
}
