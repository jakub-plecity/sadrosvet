import {Fragment} from "react";
import type {ReactNode} from "react";
// Formatting is parsed as text and React elements; product content is never executed as HTML.
function inline(value:string):ReactNode[]{
 const pattern=/(\*\*(.+?)\*\*|__(.+?)__|\*(.+?)\*)/g;const nodes:ReactNode[]=[];let last=0;let match:RegExpExecArray|null;
 while((match=pattern.exec(value))!==null){
  if(match.index>last)nodes.push(value.slice(last,match.index));
  const text=match[2]??match[3]??match[4];
  nodes.push(match[2]!==undefined?<strong key={match.index}>{text}</strong>:match[3]!==undefined?<u key={match.index}>{text}</u>:<em key={match.index}>{text}</em>);
  last=pattern.lastIndex;
 }
 if(last<value.length)nodes.push(value.slice(last));
 return nodes;
}
export function FormattedDescription({value}:{value?:string}){
 const lines=(value??"").split("\n");
 return <div className="formatted-description">{lines.map((raw,index)=>{
  let line=raw,alignment:"left"|"center"|"right"="left";
  const align=line.match(/^\[align=(left|center|right)\](.*?)\[\/align\]$/);
  if(align){alignment=align[1] as typeof alignment;line=align[2];}
  const style={textAlign:alignment};
  if(!line.trim())return <div key={index} className="description-break"/>;
  if(line.startsWith("## "))return <h4 key={index} style={style}>{inline(line.slice(3))}</h4>;
  if(line.startsWith("- "))return <p key={index} className="description-list-line" style={style}>• {inline(line.slice(2))}</p>;
  return <p key={index} style={style}>{inline(line)}</p>;
 })}</div>;
}
