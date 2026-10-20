"use client";
import {useRef,useState} from "react";
import {FormattedDescription} from "./formatted-description";
type Props={label:string;value:string;onChange:(value:string)=>void;maxLength:number;rows?:number;placeholder?:string};
export function DescriptionEditor({label,value,onChange,maxLength,rows=6,placeholder}:Props){
 const ref=useRef<HTMLTextAreaElement>(null);const [preview,setPreview]=useState(false);
 function apply(start:string,end="",block=false){
  const el=ref.current;if(!el)return;const a=el.selectionStart,b=el.selectionEnd,selection=value.slice(a,b);
  let from=a,to=b,replacement="";
  if(block){from=value.lastIndexOf("\n",a-1)+1;const next=value.indexOf("\n",b);to=next<0?value.length:next;const lines=value.slice(from,to).split("\n");
   replacement=lines.map(line=>start+line+end).join("\n");
  }else replacement=start+(selection||"text")+end;
  const updated=value.slice(0,from)+replacement+value.slice(to);
  if(updated.length>maxLength)return;
  onChange(updated);
  requestAnimationFrame(()=>{el.focus();el.setSelectionRange(from+start.length,from+replacement.length-end.length);});
 }
 function align(direction:"left"|"center"|"right"){
  const el=ref.current;if(!el)return;const a=el.selectionStart,b=el.selectionEnd;
  const from=value.lastIndexOf("\n",a-1)+1;const next=value.indexOf("\n",b);const to=next<0?value.length:next;
  const selected=value.slice(from,to).split("\n").map(line=>line.replace(/^\[align=(?:left|center|right)\]/,"").replace(/\[\/align\]$/,""));
  const replacement=selected.map(line=>direction==="left"?line:`[align=${direction}]${line}[/align]`).join("\n");
  const updated=value.slice(0,from)+replacement+value.slice(to);if(updated.length<=maxLength)onChange(updated);
  requestAnimationFrame(()=>el.focus());
 }
 return <div className="description-editor">
 <div className="description-editor-heading"><label htmlFor={label==="Popis"?"short-description":"long-description"}>{label}</label><button type="button" onClick={()=>setPreview(!preview)}>{preview?"Upravit text":"Náhled"}</button></div>
 <div className="description-toolbar" role="toolbar" aria-label={`Formátování: ${label}`}>
 <button type="button" title="Tučné" onClick={()=>apply("**","**")}><strong>B</strong></button>
 <button type="button" title="Kurzíva" onClick={()=>apply("*","*")}><em>I</em></button>
 <button type="button" title="Podtržené" onClick={()=>apply("__","__")}><u>U</u></button>
 <button type="button" title="Nadpis" onClick={()=>apply("## ","",true)}>H2</button>
 <button type="button" title="Seznam" onClick={()=>apply("- ","",true)}>☷</button>
 <button type="button" title="Zarovnat vlevo" onClick={()=>align("left")}>⇤</button>
 <button type="button" title="Zarovnat na střed" onClick={()=>align("center")}>≡</button>
 <button type="button" title="Zarovnat vpravo" onClick={()=>align("right")}>⇥</button>
 </div>
 {preview?<div className="description-live-preview"><FormattedDescription value={value}/></div>:<textarea id={label==="Popis"?"short-description":"long-description"} ref={ref} rows={rows} maxLength={maxLength} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}
 <span className="description-editor-count">{value.length} / {maxLength} znaků</span>
 </div>;
}
