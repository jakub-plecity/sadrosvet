"use client";
import {useEffect,useState} from "react";
import {readSessionCart} from "@/lib/session-cart";
import {ShoppingBag} from "lucide-react";
import {SiteBrand} from "@/components/site-footer";
import {SocialLinks} from "@/components/social-links";
export function SiteHeader({count,onCart}:{count?:number;onCart?:()=>void}) {
 const [sessionCount,setSessionCount]=useState(0);
 useEffect(()=>{const update=()=>setSessionCount(Object.values(readSessionCart()).reduce((sum,q)=>sum+q,0));update();window.addEventListener("sadrosvet:cart-change",update);return()=>window.removeEventListener("sadrosvet:cart-change",update);},[]);
 return <header className="header"><SiteBrand/><nav aria-label="Hlavní navigace"><a href="/#kolekce">Katalog</a><a href="/o-nas">O nás</a><a href="#kontakt">Kontakt</a><SocialLinks/></nav>{onCart?<button className="cart-button" onClick={onCart} aria-label={`Otevřít košík, ${count??0} položek`}><ShoppingBag size={20}/><span>Košík</span><b>{count??0}</b></button>:<a className="cart-button" href="/?kosik=1" aria-label="Otevřít košík"><ShoppingBag size={20}/><span>Košík</span><b>{sessionCount}</b></a>}</header>;
}
