"use client";
import {useState} from "react";
export function PacketaShipment({orderId,tracking,grams,handedOver}:{orderId:string;tracking:string;grams:number|null;handedOver:boolean}){
 const [code,setCode]=useState(tracking),[weight,setWeight]=useState(grams?String(grams):"500"),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[apiCreated,setApiCreated]=useState(false);
 return <div style={{display:"grid",gap:5,minWidth:190}}>
 <strong>Zásilkovna · osobní podání</strong>
 {handedOver?<span>Předáno dopravci · {code}</span>:<>
 <button type="button" disabled={busy||!!code||!Number.isInteger(Number(weight))||Number(weight)<1} onClick={async()=>{setBusy(true);setMessage("");try{const r=await fetch("/api/admin/real-orders/"+encodeURIComponent(orderId)+"/packeta-create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({weightGrams:Number(weight)})});const d=await r.json();if(!r.ok)throw new Error(d.error??"Zásilku se nepodařilo vytvořit.");setCode(d.barcode);setApiCreated(true);setMessage("Zásilka vytvořena. Otevři štítek a po fyzickém předání změň stav objednávky.");}catch(e){setMessage(e instanceof Error?e.message:"Chyba při vytváření zásilky.");}finally{setBusy(false);}}>Vytvořit zásilku přes API Zásilkovny</button>
 {apiCreated&&<a href={"/api/admin/real-orders/"+encodeURIComponent(orderId)+"/packeta-label"} target="_blank" rel="noreferrer">Otevřít přepravní štítek PDF (A6)</a>}
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
 <small>Pokud není automatické vytvoření dostupné, můžeš zásilku stále založit ručně v klientské sekci. Po úspěšném API vytvoření už zásilku znovu ručně nevytvářej.</small>
 {message&&<small role="status">{message}</small>}
 </>}
 </div>;
}
