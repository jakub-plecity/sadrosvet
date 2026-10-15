"use client";
import {useState} from "react";
export function PacketaApiCheck(){
 const [busy,setBusy]=useState(false),[result,setResult]=useState("");
 return <span style={{display:"inline-flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
 <button type="button" className="button outline" disabled={busy} onClick={async()=>{
 setBusy(true);setResult("");
 try{const response=await fetch("/api/admin/packeta-connection-test",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
 const body=await response.json();setResult(body.message??"Neznámá odpověď");}
 catch{setResult("Spojení se nepodařilo ověřit.");}finally{setBusy(false);}
 }}>{busy?"Ověřuji…":"Ověřit spojení API Zásilkovny"}</button>
 {result&&<small role="status" style={{maxWidth:340}}>{result}</small>}
 </span>;
}
