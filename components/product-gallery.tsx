"use client";
import {useState,type ReactNode} from "react";
import {ChevronLeft,ChevronRight,Package} from "lucide-react";
export function ProductGallery({images,name,onOpen,children,imageClass=""}:{images:string[];name:string;onOpen?:()=>void;children?:ReactNode;imageClass?:string}){
 const [index,setIndex]=useState(0),[start,setStart]=useState<number|null>(null);const current=Math.min(index,Math.max(0,images.length-1));const move=(delta:number)=>setIndex((current+delta+images.length)%images.length);
 return <div className="product-gallery" role="region" aria-label={`Fotografie produktu ${name}`} onTouchStart={e=>setStart(e.changedTouches[0].clientX)} onTouchEnd={e=>{if(start!==null&&images.length>1){const distance=e.changedTouches[0].clientX-start;if(Math.abs(distance)>45)move(distance<0?1:-1);}setStart(null);}}>
 <button type="button" className="product-photo" onClick={onOpen} aria-label={onOpen?`Detail ${name}`:`Fotografie ${current+1} produktu ${name}`}>{images.length?<img src={images[current]} alt={`${name} — fotografie ${current+1}`} className={imageClass}/>:<div className="no-image"><Package size={36}/><span>Produkt bez fotografie</span></div>}{children}</button>
 {images.length>1&&<><button className="gallery-arrow gallery-prev" type="button" aria-label={`Předchozí fotografie ${name}`} onClick={()=>move(-1)}><ChevronLeft size={20}/></button><button className="gallery-arrow gallery-next" type="button" aria-label={`Další fotografie ${name}`} onClick={()=>move(1)}><ChevronRight size={20}/></button><div className="gallery-dots">{images.map((src,i)=><button type="button" key={src+i} aria-label={`Zobrazit fotografii ${i+1}`} aria-pressed={current===i} onClick={()=>setIndex(i)}/>)}</div><span className="gallery-counter" aria-live="polite">{current+1} / {images.length}</span></>}
 </div>;
}
