"use client";

import {useId,useRef,useState} from "react";
import {Images,Check,X,Search} from "lucide-react";
import type {Photo} from "@/lib/photos";

type Props={value:string;onSelect:(image:string)=>void;disabled?:boolean;refreshKey?:string};

export function PhotoPicker({value,onSelect,disabled=false,refreshKey=""}:Props){
  const id=useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false);
  const [photos,setPhotos]=useState<Photo[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [loadedKey,setLoadedKey]=useState<string|null>(null);

  async function load(){
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/photos",{cache:"no-store"});
      const data=await response.json() as {error?:string;photos?:Photo[]};
      if(!response.ok||!Array.isArray(data.photos))throw new Error(data.error??"Fotografie se nepodařilo načíst.");
      setPhotos(data.photos);setLoadedKey(refreshKey);
    }catch(e){setError(e instanceof Error?e.message:"Fotografie se nepodařilo načíst.");}
    finally{setLoading(false);}
  }
  function close(){setOpen(false);trigger.current?.focus();}
  function toggle(){
    if(open){close();return;}
    setOpen(true);setQuery("");
    // Opening always refreshes the shared gallery, including uploads made elsewhere.
    void load();
  }
  const matching=photos.filter(photo=>photo.name.toLocaleLowerCase("cs").includes(query.trim().toLocaleLowerCase("cs")));
  const needsRefresh=open&&loadedKey!==null&&loadedKey!==refreshKey;

  return <div className="photo-picker">
    <button type="button" ref={trigger} className="photo-picker-trigger" disabled={disabled} aria-expanded={open} aria-controls={id} onClick={toggle}><Images size={18}/>{open?"Skrýt galerii":"Vybrat z galerie"}</button>
    {open&&<section id={id} className="photo-library" aria-label="Galerie fotografií" aria-busy={loading}>
      <div className="photo-library-heading"><h3>Galerie fotografií</h3><button type="button" className="photo-library-close" disabled={disabled} onClick={close} aria-label="Zavřít galerii"><X size={18}/></button></div>
      <p className="photo-library-description">Vyber fotografii. K produktu se přiřadí po uložení.</p>
      <label className="photo-library-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label="Hledat fotografii podle názvu" placeholder="Hledat fotografii…" value={query} disabled={disabled||loading} onChange={e=>setQuery(e.target.value)}/></label>
      {loading?<p className="photo-library-notice" role="status">Načítáme fotografie…</p>:error?<div className="photo-library-notice"><p className="error" role="alert">{error}</p><button type="button" className="text-link" disabled={disabled} onClick={()=>void load()}>Zkusit znovu</button></div>:needsRefresh?<div className="photo-library-notice"><p>Do galerie přibyla nová fotografie.</p><button type="button" className="text-link" disabled={disabled} onClick={()=>void load()}>Obnovit galerii</button></div>:matching.length===0?<p className="photo-library-notice">{photos.length?"Žádná fotografie neodpovídá hledání.":"Galerie zatím nemá žádné fotografie. Nahraj první fotografii tlačítkem výše."}</p>:<div className="photo-library-grid">{matching.map(photo=><button key={photo.id} type="button" className="photo-choice" aria-pressed={value===photo.image} disabled={disabled} onClick={()=>{onSelect(photo.image);close();}}>
        <span className="photo-choice-preview"><img src={photo.image} alt="" loading="lazy"/>{value===photo.image&&<span className="photo-choice-selected"><Check size={15}/>Vybráno</span>}</span>
        <span className="photo-choice-name">{photo.name}</span><span className="photo-choice-usage">{photo.productCount?`U produktů: ${photo.productCount}`:"Zatím nepřiřazená"}</span>
      </button>)}</div>}
    </section>}
  </div>;
}
