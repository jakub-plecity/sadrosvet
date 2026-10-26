"use client";
import {useEffect,useState,useRef} from "react";
import {readSessionCart} from "@/lib/session-cart";
import {ShoppingBag,Menu,X} from "lucide-react";
import {SiteBrand} from "@/components/site-footer";
import {SocialLinks} from "@/components/social-links";
export function SiteHeader({count,onCart}:{count?:number;onCart?:()=>void}) {
 const [menuOpen,setMenuOpen]=useState(false);
 const headerRef=useRef<HTMLElement>(null),menuButtonRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!menuOpen)return;const closeOutside=(e:PointerEvent)=>{if(!headerRef.current?.contains(e.target as Node))setMenuOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setMenuOpen(false);menuButtonRef.current?.focus();}};document.addEventListener("pointerdown",closeOutside);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",closeOutside);document.removeEventListener("keydown",escape);};},[menuOpen]);
 const [sessionCount,setSessionCount]=useState(0);
 useEffect(()=>{const update=()=>setSessionCount(Object.values(readSessionCart()).reduce((sum,q)=>sum+q,0));update();window.addEventListener("sadrosvet:cart-change",update);return()=>window.removeEventListener("sadrosvet:cart-change",update);},[]);
 return <header className="header" ref={headerRef}><SiteBrand/><button ref={menuButtonRef} type="button" className="mobile-menu-toggle" aria-label={menuOpen?"Zavřít menu":"Otevřít menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X size={24} aria-hidden="true"/>:<Menu size={24} aria-hidden="true"/>}</button><nav id="site-navigation" className={menuOpen?"site-navigation is-open":"site-navigation"} aria-label="Hlavní navigace" onClick={e=>{if((e.target as Element).closest("a"))setMenuOpen(false);}}><a href="/#kolekce">Katalog</a><a href="/o-nas">O nás</a><a href="#kontakt">Kontakt</a><SocialLinks/></nav>{onCart?<button className="cart-button" onClick={()=>{setMenuOpen(false);onCart();}} aria-label={`Otevřít košík, ${count??0} položek`}><ShoppingBag size={20}/><span>Košík</span><b>{count??0}</b></button>:<a className="cart-button" href="/?kosik=1" aria-label="Otevřít košík"><ShoppingBag size={20}/><span>Košík</span><b>{sessionCount}</b></a>}</header>;
}
