"use client";
import {useEffect,useState} from "react";
import type {Product} from "@/lib/catalog";
type Check={title:string;state:"implemented"|"check"|"blocked";detail:string;href?:string};
export function LaunchReadiness({products,loading,error,adminRestricted,onEdit,onRefresh}:{products:Product[];loading:boolean;error:string;adminRestricted:boolean;onEdit:(p:Product)=>void;onRefresh:()=>void}){
 const [checkout,setCheckout]=useState<"loading"|"on"|"off"|"error">("loading");
 useEffect(()=>{let active=true;fetch("/api/checkout",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{if(active)setCheckout(d.enabled===true?"on":"off")}).catch(()=>{if(active)setCheckout("error")});return()=>{active=false}},[]);
 const published=products.filter(p=>p.status==="active");
 const invalid=published.filter(p=>p.sample||!p.image||p.image==="/collection.png"||!p.description?.trim()||/ukázkov|demo produkt|ilustrační/i.test(p.description));
 const checks:Check[]=[
 {title:"Doména a HTTPS",state:"check",detail:"sadrosvet.cz je podle provozovatele funkční. Před spuštěním ověřte také administraci, API a přesměrování www.",href:"https://sadrosvet.cz"},
 {title:"Skutečné objednávky a odečet skladu",state:"implemented",detail:"Serverová evidence reálných objednávek, kontrola zásob, idempotence a přehled objednávek jsou implementovány. Vyžadují produkční transakční test."},
 {title:"Aktivace objednávek",state:checkout==="on"?"check":"blocked",detail:checkout==="on"?"ENABLE_REAL_CHECKOUT je zapnutý. Ověřte celý nákup v produkci a doručení e-mailu.":checkout==="off"?"ENABLE_REAL_CHECKOUT je vypnutý; zákazníci nemohou odesílat reálné objednávky. Zapínejte až po splnění kontrol.":checkout==="loading"?"Ověřuji provozní režim…":"Provozní přepínač objednávek se nepodařilo ověřit."},
 {title:"Comgate a platby",state:"blocked",detail:"Informace o Comgate jsou zveřejněné. Bankovní tlačítka jsou aktivní u poskytovatele, ale nejsou propojena s košíkem. Visa, Mastercard, Apple Pay a Google Pay nezpřístupňujte před schválením a ostrým testem."},
 {title:"Doprava a štítky",state:"check",detail:"Balíkovna a Zásilkovna jsou nabízené v košíku. Komunikace se Zásilkovnou je potvrzena, první reálná zásilka a PDF A6 však nebyly otestovány. Doručení Zásilkovnou na adresu zatím vyžaduje ruční založení."},
 {title:"E-mailová potvrzení",state:"check",detail:"Implementován outbox a odesílání přes Resend. Ověřte reálné doručení potvrzení, správný souhrn objednávky i případné opakování při chybě."},
 {title:"Právní a bezpečnostní informace",state:"check",detail:"Stránky podmínek, odstoupení, soukromí, dopravy a bezpečnosti výrobků jsou připravené jako provozní podklady. Vyžadují schválení provozovatelem a kontrolu úplnosti údajů jednotlivých výrobků.",href:"/material-a-bezpecnostni-informace"},
 {title:"Ochrana údajů a provoz",state:"check",detail:"Ověřte lhůty uchování dat, smlouvy se zpracovateli, cookies, zálohy a obnovu databáze a správcovský přístup na vlastní doméně."},
 {title:"Administrace",state:adminRestricted?"implemented":"blocked",detail:adminRestricted?"Přístup je omezen na přihlášeného správce. Otestujte také odhlášení a zamítnutí neautorizovaných požadavků.":"Ověření správce není aktivní."}
 ];
 return <section className="launch-readiness" aria-labelledby="launch-title">
  <div className="launch-heading"><div><span className="eyebrow">KONTROLA PŘED SPUŠTĚNÍM</span><h2 id="launch-title">Co ještě zbývá</h2><p>Stav kódu a kontrolní seznam ostrého provozu. Položky „Implementováno“ samy o sobě neznamenají dokončený produkční test.</p></div><button className="button outline" onClick={onRefresh} disabled={loading}>{loading?"Načítám…":"Obnovit katalog"}</button></div>
  <p className="launch-verdict"><strong>Online platby zatím nejsou propojené.</strong> Ostré objednávky závisejí na nastavení Netlify a závěrečném end-to-end testu. Přehled nic automaticky neaktivuje.</p>
  <div className="launch-counts"><span><strong>{checks.filter(c=>c.state==="implemented").length}</strong> Implementováno</span><span><strong>{checks.filter(c=>c.state==="check").length}</strong> Nutno ověřit</span><span><strong>{checks.filter(c=>c.state==="blocked").length}</strong> Nedokončeno</span></div>
  <div className="launch-checklist">{checks.map(c=><article key={c.title} className="launch-check"><div className="launch-check-title"><h3>{c.title}</h3><span className={`launch-status launch-status-${c.state==="implemented"?"ready":c.state==="check"?"check":"blocked"}`}>{c.state==="implemented"?"Implementováno":c.state==="check"?"Ověřit":"Nedokončeno"}</span></div><p>{c.detail}</p>{c.href&&<a className="text-link" href={c.href}>Otevřít</a>}</article>)}</div>
  <section className="launch-products" aria-labelledby="launch-products-title"><h3 id="launch-products-title">Kontrola zveřejněných produktů</h3>{loading||error?<p>{error||"Načítám katalog…"}</p>:invalid.length?<ul>{invalid.map(p=><li key={p.id}><div><strong>{p.name}</strong><p>Prověřit popis, fotografii a případné ukázkové označení.</p></div><button className="button outline" onClick={()=>onEdit(p)}>Upravit</button></li>)}</ul>:<p>{published.length} zveřejněných produktů bez automaticky zjistitelných nedostatků. Ručně ověřte materiál, rozměry, označení výrobce, rizika a skutečné skladové zásoby.</p>}</section>
 </section>;
}
