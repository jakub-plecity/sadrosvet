"use client";
import {useEffect,useState} from "react";
import type {Product} from "@/lib/catalog";
type Check={title:string;state:"implemented"|"check"|"blocked";detail:string;href?:string};
export function LaunchReadiness({products,loading,error,adminRestricted,onEdit,onRefresh}:{products:Product[];loading:boolean;error:string;adminRestricted:boolean;onEdit:(p:Product)=>void;onRefresh:()=>void}){
 const [checkout,setCheckout]=useState<"loading"|"on"|"off"|"error">("loading");
 const [comgate,setComgate]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/checkout",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{if(active){setCheckout(d.enabled===true?"on":"off");setComgate(d.comgateEnabled===true)}}).catch(()=>{if(active)setCheckout("error")});return()=>{active=false}},[]);
 const published=products.filter(p=>p.status==="active");
 const invalid=published.filter(p=>p.sample||!p.image||p.image==="/collection.png"||!p.description?.trim()||/ukázkov|demo produkt|ilustrační/i.test(p.description));
 const checks:Check[]=[
 {title:"Doména a HTTPS",state:"implemented",detail:"E-shop běží na vlastní doméně sadrosvet.cz. Ještě zkontrolujte přesměrování www a funkčnost na mobilu.",href:"https://sadrosvet.cz"},
 {title:"Reálné objednávky",state:"implemented",detail:"Objednávky se ukládají do databáze a zobrazují se přímo v záložce Objednávky. První ostrá objednávka č. 2 byla vytvořena a uhrazena."},
 {title:"Comgate – ostrá platba a potvrzení",state:"implemented",detail:"Ověřena skutečná úhrada 10 Kč objednávky č. 2, změna jejího platebního stavu na Zaplaceno a doručení potvrzovacího e-mailu. Propojení s košíkem je funkční."},
 {title:"Veřejná dostupnost online plateb",state:"check",detail:checkout==="loading"?"Ověřuji nastavení pokladny…":checkout==="error"?"Aktuální nastavení plateb se nepodařilo zjistit.":checkout==="off"?"Ostré objednávky jsou momentálně vypnuté.":comgate?"Comgate je dostupná pro aktuálně přihlášeného správce. Z toho nelze určit, zda už platí i pro veřejnost; ověřte COMGATE_ADMIN_ONLY na Netlify.":"Comgate není pro aktuální relaci dostupná. Ověřte přepínače ENABLE_COMGATE_CHECKOUT a COMGATE_ADMIN_ONLY před veřejným spuštěním."},
 {title:"Sklad a storno objednávek",state:"check",detail:"Odečet zásob fungoval při ostrém nákupu. Objednávka č. 1 zůstala nezaplacená; je potřeba ověřit její skutečné storno a konečný sklad 9 ks. Ruční změny skladu znemožňují vyvozovat historii pouze z aktuálního počtu."},
 {title:"E-mailové potvrzení",state:"implemented",detail:"Potvrzovací e-mail k ostré zaplacené objednávce č. 2 byl doručen. Automatické opakování po selhání doručení zatím nebylo provozně ověřeno."},
 {title:"Doprava a zásilkové štítky",state:"check",detail:"V košíku jsou připravené způsoby doručení. Před veřejným spuštěním ověřte zásilku přes Zásilkovnu i Balíkovnu, výdejní místo, štítek a expedici."},
 {title:"Apple Pay a Google Pay",state:"check",detail:"Comgate je napojená; dostupnost Apple Pay a Google Pay pro skutečné zákazníky je nutné ověřit přímo v nabídce platební brány na podporovaných zařízeních."},
 {title:"Právní a bezpečnostní informace",state:"check",detail:"Na webu jsou připravené obchodní podmínky, odstoupení od smlouvy a informace o výrobcích. Před spuštěním zkontrolujte správnost údajů, upozornění, že dekorativní svíčky se nesmějí zapalovat, a náležitosti jednotlivých produktů.",href:"/material-a-bezpecnostni-informace"},
 {title:"Ochrana dat a provoz",state:"check",detail:"Ještě ověřte zálohy a obnovu databáze, cookies, retenční lhůty, provozní alerty a oprávnění externích poskytovatelů."},
 {title:"Administrace",state:adminRestricted?"implemented":"blocked",detail:adminRestricted?"Přístup je omezen na správce. Správa objednávek včetně změny stavu je dostupná v hlavní administraci; otestujte i odhlášení a odmítnutí nepřihlášeného přístupu.":"Ochrana administrace není potvrzena."}
 ];
 return <section className="launch-readiness" aria-labelledby="launch-title">
  <div className="launch-heading"><div><span className="eyebrow">KONTROLA PŘED SPUŠTĚNÍM</span><h2 id="launch-title">Co ještě zbývá</h2><p>Aktualizováno podle ostrého testu Comgate a stavu implementace. Položky k ověření vyžadují závěrečný test před otevřením pro veřejnost.</p></div><button className="button outline" onClick={onRefresh} disabled={loading}>{loading?"Načítám…":"Obnovit katalog"}</button></div>
  <p className="launch-verdict"><strong>Ostrá platba Comgate i potvrzovací e-mail fungují.</strong> Před veřejným spuštěním ještě ověřte storno testovací objednávky, dopravu a nastavení COMGATE_ADMIN_ONLY. Tento přehled nic automaticky nezapíná.</p>
  <div className="launch-counts"><span><strong>{checks.filter(c=>c.state==="implemented").length}</strong> Implementováno</span><span><strong>{checks.filter(c=>c.state==="check").length}</strong> Nutno ověřit</span><span><strong>{checks.filter(c=>c.state==="blocked").length}</strong> Nedokončeno</span></div>
  <div className="launch-checklist">{checks.map(c=><article key={c.title} className="launch-check"><div className="launch-check-title"><h3>{c.title}</h3><span className={`launch-status launch-status-${c.state==="implemented"?"ready":c.state==="check"?"check":"blocked"}`}>{c.state==="implemented"?"Implementováno":c.state==="check"?"Ověřit":"Nedokončeno"}</span></div><p>{c.detail}</p>{c.href&&<a className="text-link" href={c.href}>Otevřít</a>}</article>)}</div>
  <section className="launch-products" aria-labelledby="launch-products-title"><h3 id="launch-products-title">Kontrola zveřejněných produktů</h3>{loading||error?<p>{error||"Načítám katalog…"}</p>:invalid.length?<ul>{invalid.map(p=><li key={p.id}><div><strong>{p.name}</strong><p>Prověřit popis, fotografii a případné ukázkové označení.</p></div><button className="button outline" onClick={()=>onEdit(p)}>Upravit</button></li>)}</ul>:<p>{published.length} zveřejněných produktů bez automaticky zjistitelných nedostatků. Ručně ověřte materiál, rozměry, označení výrobce, rizika a skutečné skladové zásoby.</p>}</section>
 </section>;
}
