"use client";
import {useEffect,useState} from "react";
import {RefreshCcw} from "lucide-react";
import {toast} from "sonner";
type Scope="products"|"categories"|"all";
type Policy={products:{tag:string;seconds:number};categories:{tag:string;seconds:number}};
export function CachePanel(){
 const [policy,setPolicy]=useState<Policy|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<Scope|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();
  fetch("/api/admin/cache",{cache:"no-store",signal:controller.signal}).then(async r=>{
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Cache nelze načíst.");setPolicy(d.policy);
  }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Cache nelze načíst.");})
  .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[]);
 async function purge(scope:Scope){
  if(busy)return;setBusy(scope);
  try{const r=await fetch("/api/admin/cache",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope}),cache:"no-store"});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Cache se nepodařilo obnovit.");
   toast.success("Cache byla zneplatněna; další návštěva načte aktuální data.");
  }catch(e){toast.error(e instanceof Error?e.message:"Obnovení cache selhalo.");}
  finally{setBusy(null);}
 }
 return <section className="launch-panel" aria-labelledby="cache-heading">
  <h2 id="cache-heading">Cache veřejného katalogu</h2>
  <p>Cache šetří opakované dotazy do databáze. Po úpravě produktu nebo kategorie se automaticky zneplatní. Návštěvnost, objednávky, platby a administrátorská data nejsou součástí této cache.</p>
  {loading?<p>Načítání nastavení…</p>:error?<p role="alert" className="error">{error}</p>:policy&&<>
   <div className="mt-3 flex flex-wrap items-center gap-3">
    <div><strong>Produkty:</strong> {policy.products.seconds/60} minut</div>
    <div><strong>Kategorie:</strong> {policy.categories.seconds/60} minut</div>
   </div>
   <div className="mt-3 flex flex-wrap gap-3">
    <button type="button" className="button outline" disabled={busy!==null} onClick={()=>void purge("products")}><RefreshCcw size={17}/>Obnovit produkty</button>
    <button type="button" className="button outline" disabled={busy!==null} onClick={()=>void purge("categories")}><RefreshCcw size={17}/>Obnovit kategorie</button>
    <button type="button" className="button blue" disabled={busy!==null} onClick={()=>void purge("all")}><RefreshCcw size={17}/>Vymazat veřejnou cache</button>
   </div>
   <p className="muted mt-3">Správa používá interní cache Next.js. Neuvádíme neověřené statistiky zásahů ani počty položek. Zásah do cache nesmaže produkty, fotografie ani data z databáze.</p>
  </>}
 </section>;
}
