"use client";
import {useEffect,useMemo,useState} from "react";
import {LineChart,Line,CartesianGrid,XAxis,YAxis,Tooltip,ResponsiveContainer} from "recharts";

type Point={date:string;clicks:number;impressions:number;ctr:number;position:number};
type Sync={sync_date:string;status:string;finished_at:string|null;error_code:string|null};
type Payload={rows:Point[];sync:Sync|null;configured:boolean;error?:string};
const format=(n:number)=>new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2}).format(n);
export function SearchConsoleTraffic(){
 const [data,setData]=useState<Payload|null>(null);
 const [error,setError]=useState("");
 const [days,setDays]=useState(28);
 useEffect(()=>{
   const controller=new AbortController();
   fetch("/api/admin/traffic",{cache:"no-store",signal:controller.signal})
     .then(async r=>{const d=await r.json() as Payload;if(!r.ok)throw Error(d.error??"Načítání selhalo.");setData(d);})
     .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Načítání selhalo.");});
   return ()=>controller.abort();
 },[]);
 const filtered=useMemo(()=>{
   const threshold=new Date();threshold.setUTCHours(0,0,0,0);threshold.setUTCDate(threshold.getUTCDate()-days-2);
   return (data?.rows??[]).filter(row=>new Date(row.date+"T00:00:00Z")>=threshold).slice(-days);
 },[data,days]);
 const totals=useMemo(()=>{
   const clicks=filtered.reduce((n,p)=>n+p.clicks,0),impressions=filtered.reduce((n,p)=>n+p.impressions,0);
   return {clicks,impressions,ctr:impressions?100*clicks/impressions:0,
     position:impressions?filtered.reduce((n,p)=>n+p.position*p.impressions,0)/impressions:0};
 },[filtered]);
 return <section style={{padding:"1.25rem 0"}} aria-label="Statistiky Google Search Console">
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
    <div><h2>Návštěvnost z Googlu</h2><p className="muted">Organické vyhledávání podle Google Search Console (nikoliv všechny návštěvy webu).</p></div>
    <label>Období: <select value={days} onChange={e=>setDays(Number(e.target.value))}>
      <option value={7}>7 dní</option><option value={28}>28 dní</option><option value={90}>90 dní</option>
    </select></label>
   </div>
   {error?<p role="alert" className="notice error">{error}</p>:!data?<p className="notice">Načítání uložených statistik…</p>:<>
    {!data.configured&&<p className="notice">Připojení čeká na nastavení přístupových údajů služby Google.</p>}
    <p className="muted">Poslední synchronizace: {data.sync?.finished_at?new Date(data.sync.finished_at).toLocaleString("cs-CZ"): "zatím neproběhla"}
    {data.sync?.status==="error"?" · Chyba synchronizace ("+(data.sync.error_code??"neznámá")+")":""}
    {data.sync?.status==="started"?" · Právě probíhá":""}. Aktualizace automaticky 1× denně.</p>
    <div className="stat-grid">
      <div><span>Kliknutí</span><strong>{format(totals.clicks)}</strong></div>
      <div><span>Zobrazení</span><strong>{format(totals.impressions)}</strong></div>
      <div><span>Průměrné CTR</span><strong>{format(totals.ctr)} %</strong></div>
      <div><span>Průměrná pozice</span><strong>{totals.impressions?format(totals.position):"—"}</strong></div>
    </div>
    {filtered.length===0?<p className="notice">Zatím nejsou k dispozici data. První synchronizace proběhne po nastavení propojení.</p>:
     <div style={{width:"100%",height:320,marginTop:24}}>
      <h3>Kliknutí a zobrazení v čase</h3>
      <ResponsiveContainer width="100%" height="90%">
       <LineChart data={filtered} margin={{top:20,right:14,bottom:12,left:0}}>
        <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} minTickGap={25}/>
        <YAxis yAxisId="clicks" allowDecimals={false}/><YAxis yAxisId="impressions" orientation="right" allowDecimals={false}/>
        <Tooltip labelFormatter={v=>String(v)} formatter={(v,name)=>[format(Number(v)),String(name)]}/>
        <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Kliknutí" stroke="#2563eb" dot={false}/>
        <Line yAxisId="impressions" type="monotone" dataKey="impressions" name="Zobrazení" stroke="#16a34a" dot={false}/>
       </LineChart>
      </ResponsiveContainer>
     </div>}
    <p className="muted">Google může zveřejňovat údaje se zpožděním; synchronizace načítá posledních 90 uzavřených dní.</p>
   </>}
 </section>;
}
