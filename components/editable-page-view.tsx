import type {CSSProperties,ReactNode} from "react";
import {shippingServices} from "@/lib/checkout";
import type {PageBlock,PageDocument} from "@/lib/editable-page-content";

function inline(block:PageBlock):ReactNode{
 return block.runs.map((run,i)=>{
  let content:ReactNode=run.text;
  if(run.bold)content=<strong>{content}</strong>;
  if(run.italic)content=<em>{content}</em>;
  if(run.underline)content=<u>{content}</u>;
  if(run.href)content=<a href={run.href} rel={run.href.startsWith("https://")?"noopener noreferrer":undefined} target={run.href.startsWith("https://")?"_blank":undefined}>{content}</a>;
  return <span key={i}>{content}</span>;
 });
}
export function EditablePageView({document,paymentAvailable,page}:{document:PageDocument;paymentAvailable?:boolean;page?:string}){
 const outline=page==="obchodni-podminky"
  ?document.blocks.filter(b=>b.kind==="h2"&&b.anchor).map(b=>({id:b.anchor!,title:b.runs.map(r=>r.text).join("")}))
  :[];
 return <div className="editable-public-copy">
  {document.blocks.map((block,i)=>{
   if(block.kind==="shippingRates")return <ul key={block.key} className="editable-shipping-rates">{shippingServices.filter(s=>s.available).map(service=><li key={service.id}><strong>{service.carrier} – {service.label}:</strong> {(service.priceMinor/100).toLocaleString("cs-CZ")} Kč{service.codMinor>0?` (dobírka +${(service.codMinor/100).toLocaleString("cs-CZ")} Kč)`:""}.</li>)}</ul>;
   if(block.kind==="paymentAvailability")return <p key={block.key}>{paymentAvailable?"V košíku můžete zvolit online platbu přes zabezpečenou bránu Comgate. Po odeslání objednávky vás přesměrujeme na platební bránu, kde vyberete dostupný způsob úhrady.":"Online platba přes Comgate momentálně není veřejně dostupná. Aktuálně nabízené způsoby úhrady najdete v košíku."}</p>;
   const style:CSSProperties={textAlign:block.align,color:block.color==="ink"?"#1e1e1b":block.color==="muted"?"#64645f":block.color==="blue"?"#2b5187":block.color==="terracotta"?"#a05239":undefined,fontFamily:block.font==="serif"?"Georgia, 'Times New Roman', serif":block.font==="sans"?"Arial, Helvetica, sans-serif":undefined,fontSize:block.size==="small"?"0.88rem":block.size==="large"?"1.28rem":block.size==="xlarge"?"1.6rem":undefined};
   const children=inline(block);
   if(block.kind==="h1")return <div key={block.key}><h1 id={block.anchor} style={style}>{children}</h1>{outline.length>0&&<nav className="legal-contents" aria-label="Obsah obchodních podmínek">{outline.map(item=><a key={item.id} href={"#"+item.id}>{item.title}</a>)}</nav>}</div>;
   if(block.kind==="h2")return <h2 key={block.key} id={block.anchor} style={style}>{children}</h2>;
   if(block.kind==="h3")return <h3 key={block.key} id={block.anchor} style={style}>{children}</h3>;
   if(block.kind==="li")return <ul key={block.key} className="editable-list"><li style={style}>{children}</li></ul>;
   if(block.kind==="address")return <address key={block.key} style={style}>{children}</address>;
   return <p key={block.key} style={style}>{children}</p>;
  })}
 </div>;
}
