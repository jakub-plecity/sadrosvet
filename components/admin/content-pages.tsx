"use client";
import {useState,useRef,useCallback} from "react";
import {FilePenLine,Eye,Save,RotateCcw,Plus,Trash2,ArrowUp,ArrowDown,ExternalLink,Type,AlignLeft,AlignCenter,AlignRight,Link2} from "lucide-react";
import {Dialog,DialogContent,DialogDescription,DialogTitle} from "@/components/ui/dialog";
import {toast} from "sonner";
import {EditablePageView} from "@/components/editable-page-view";
import {editablePageNames,type EditablePageId,type PageBlock,type PageDocument} from "@/lib/editable-page-content";

type Run=PageBlock["runs"][number];
const pages=Object.entries(editablePageNames) as [EditablePageId,string][];
const kinds:Record<PageBlock["kind"],string>={h1:"Hlavní nadpis",h2:"Nadpis sekce",h3:"Podnadpis",p:"Odstavec",li:"Položka seznamu",address:"Adresa",shippingRates:"Aktuální ceny dopravy",paymentAvailability:"Dostupnost Comgate"};
const newBlock=(kind:PageBlock["kind"]="p"):PageBlock=>({key:crypto.randomUUID(),kind,runs:[{text:"Nový text"}],align:"left",font:"default",color:"default",size:"normal"});
const safeLink=(url:string)=>/^(https:\/\/[^\s<>"]+|mailto:[^\s<>"]+|\/(?!\/)[^\s<>"]*)$/.test(url);

function readRuns(root:Node):Run[]{
 const runs:Run[]=[];
 function visit(node:Node,mark:Omit<Run,"text">){
  if(node.nodeType===Node.TEXT_NODE){
   const text=node.textContent??"";
   if(text){const last=runs[runs.length-1];if(last&&last.bold===mark.bold&&last.italic===mark.italic&&last.underline===mark.underline&&last.href===mark.href)last.text+=text;else runs.push({text,...mark});}
   return;
  }
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const element=node as HTMLElement;
  if(element.tagName==="BR"){runs.push({text:"\n",...mark});return;}
  const href=element.tagName==="A"?element.getAttribute("href")??"":null;
  const style=element.getAttribute("style")??"";
  const next:Omit<Run,"text">={
   bold:mark.bold||["STRONG","B"].includes(element.tagName)||/font-weight:\s*(bold|[6-9]00)/i.test(style)||undefined,
   italic:mark.italic||["EM","I"].includes(element.tagName)||/font-style:\s*italic/i.test(style)||undefined,
   underline:mark.underline||element.tagName==="U"||/text-decoration[^;]*underline/i.test(style)||undefined,
   href:href&&safeLink(href)?href:mark.href
  };
  element.childNodes.forEach(child=>visit(child,next));
 }
 root.childNodes.forEach(node=>visit(node,{}));
 return runs.length?runs:[{text:""}];
}
function extractOriginal(html:string,page:EditablePageId):PageDocument{
 const parsed=new DOMParser().parseFromString(html,"text/html");
 const main=parsed.querySelector("main.legal-page");
 if(!main)throw new Error("Stránka neobsahuje očekávaný text. Obsah se nezměnil.");
 const nodes=Array.from(main.querySelectorAll("h1,h2,h3,p,li,address,.legal-actions > a"));
 const blocks:PageBlock[]=[];
 const seenDynamic=new Set<string>();
 for(const element of nodes){
  if(element.closest(".legal-breadcrumb,.legal-contents"))continue;
  if(element.closest(".legal-actions")&&element.tagName!=="A")continue;
  const tag=element.tagName.toLowerCase();
  if(tag==="li"&&page==="doprava-a-platba"&&element.closest("ul")?.querySelector("li strong")?.textContent?.includes("Osobní odběr")){
   if(!seenDynamic.has("rates")){blocks.push({...newBlock("shippingRates"),runs:[{text:"Aktuální sazby dopravy"}]});seenDynamic.add("rates");}
   continue;
  }
  const plain=element.textContent?.trim()??"";
  if(tag==="p"&&page==="doprava-a-platba"&&(plain.startsWith("V košíku můžete zvolit online platbu přes zabezpečenou bránu Comgate")||plain.startsWith("Online platba přes Comgate momentálně není veřejně dostupná"))){
   blocks.push({...newBlock("paymentAvailability"),runs:[{text:"Automatický stav online platby"}]});continue;
  }
  const kind:PageBlock["kind"]=tag==="a"?"p":(["h1","h2","h3","p","li","address"].includes(tag)?tag:"p") as PageBlock["kind"];
  const parent=element.closest("section[id],article[id]");
  const anchor=kind==="h2"&&parent?.id?parent.id:undefined;
  const runs=tag==="a"?[{text:plain,href:element.getAttribute("href")??undefined}].filter(r=>!r.href||safeLink(r.href)) as Run[]:readRuns(element);
  blocks.push({...newBlock(kind),runs:runs.length?runs:[{text:plain}],anchor});
 }
 if(!blocks.some(b=>b.kind==="h1")||blocks.length<3)throw new Error("Nepodařilo se načíst úplný obsah stránky. Uložení bylo zastaveno.");
 return {blocks};
}
function EditableText({block,onBlur,onFocus,register}:{block:PageBlock;onBlur:()=>void;onFocus:()=>void;register:(element:HTMLDivElement|null)=>void}){
 return <div className="cms-rich-input" contentEditable suppressContentEditableWarning role="textbox" aria-label="Upravit text bloku" tabIndex={0} ref={register} onBlur={onBlur} onFocus={onFocus}>
  {block.runs.map((run,index)=>{
   let child:React.ReactNode=run.text;
   if(run.bold)child=<strong>{child}</strong>;
   if(run.italic)child=<em>{child}</em>;
   if(run.underline)child=<u>{child}</u>;
   if(run.href)child=<a href={run.href}>{child}</a>;
   return <span key={index}>{child}</span>;
  })}
 </div>;
}
export function AdminContentPages(){
 const [page,setPage]=useState<EditablePageId|null>(null);
 const [blocks,setBlocks]=useState<PageBlock[]>([]);
 const [version,setVersion]=useState<string|null>(null);
 const [loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const [preview,setPreview]=useState(false),[dirty,setDirty]=useState(false),[selected,setSelected]=useState<string|null>(null);
 const elements=useRef<Map<string,HTMLDivElement>>(new Map());
 const focus=useRef<HTMLDivElement|null>(null);
 const updateBlock=(key:string,patch:Partial<PageBlock>)=>{flush();setBlocks(prev=>prev.map(b=>b.key===key?{...b,...patch}:b));setDirty(true);};
 const flush=useCallback(()=>{
  setBlocks(current=>current.map(block=>{
   const element=elements.current.get(block.key);
   return element&&block.kind!=="shippingRates"&&block.kind!=="paymentAvailability"?{...block,runs:readRuns(element)}:block;
  }));
 },[]);
 function collect():PageDocument{
  return {blocks:blocks.map(block=>{
   const el=elements.current.get(block.key);
   return el&&block.kind!=="shippingRates"&&block.kind!=="paymentAvailability"?{...block,runs:readRuns(el)}:block;
  })};
 }
 async function openPage(id:EditablePageId){
  if(dirty&&!window.confirm("Máte neuložené změny. Opravdu je chcete opustit?"))return;
  setPage(id);setBlocks([]);setVersion(null);setSelected(null);setError("");setPreview(false);setDirty(false);setLoading(true);elements.current.clear();
  try{
   const response=await fetch("/api/admin/page-content/"+id,{cache:"no-store"});
   const result=await response.json() as {document:PageDocument|null;version:string|null;error?:string};
   if(!response.ok)throw new Error(result.error??"Editor není dostupný.");
   if(result.document){setBlocks(result.document.blocks);setVersion(result.version);}
   else{
    const publicPage=await fetch("/"+id,{cache:"no-store"});
    if(!publicPage.ok)throw new Error("Nelze načíst výchozí text stránky.");
    setBlocks(extractOriginal(await publicPage.text(),id).blocks);setVersion(null);
   }
  }catch(err){setError(err instanceof Error?err.message:"Nepodařilo se načíst text.");}
  finally{setLoading(false);}
 }
 function format(command:string,value?:string){
  if(!focus.current){toast.info("Nejprve označte text v editoru.");return;}
  focus.current.focus();
  document.execCommand(command,false,value);
  setDirty(true);
  flush();
 }
 async function save(){
  if(!page||saving||loading)return;
  setSaving(true);setError("");
  try{
   const doc=collect();
   if(!doc.blocks.some(b=>b.kind==="h1"))throw new Error("Stránka musí obsahovat hlavní nadpis.");
   const response=await fetch("/api/admin/page-content/"+page,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({document:doc,version})});
   const data=await response.json() as {error?:string;version?:string};
   if(!response.ok)throw new Error(data.error??"Uložení nebylo úspěšné.");
   setBlocks(doc.blocks);setVersion(data.version??null);setDirty(false);toast.success("Stránka byla publikována.");
  }catch(err){setError(err instanceof Error?err.message:"Uložení selhalo.");}finally{setSaving(false);}
 }
 async function restore(){
  if(!page||!version)return;
  if(!window.confirm("Vrátit celé původní znění? Veškeré uložené úpravy této stránky budou smazány."))return;
  setSaving(true);setError("");
  try{
   const response=await fetch("/api/admin/page-content/"+page,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({version})});
   const data=await response.json() as {error?:string};if(!response.ok)throw new Error(data.error??"Původní verzi nelze obnovit.");
   setDirty(false);setPage(null);setBlocks([]);toast.success("Bylo obnoveno původní znění stránky.");
  }catch(err){setError(err instanceof Error?err.message:"Obnovení selhalo.");}finally{setSaving(false);}
 }
 function add(kind:PageBlock["kind"]){
  const block=newBlock(kind);flush();setBlocks(prev=>[...prev,block]);setSelected(block.key);setDirty(true);
 }
 function move(key:string,offset:number){
  flush();setBlocks(current=>{const next=[...current],index=next.findIndex(b=>b.key===key),to=index+offset;if(index<0||to<0||to>=next.length)return current;const item=next.splice(index,1)[0];next.splice(to,0,item);return next;});setDirty(true);
 }
 function remove(key:string){flush();setBlocks(prev=>prev.filter(b=>b.key!==key));elements.current.delete(key);setDirty(true);setSelected(null);}
 return <section className="admin-cms-section" aria-labelledby="cms-heading">
  <div className="admin-cms-heading"><div><span className="eyebrow">OBSAH WEBU</span><h2 id="cms-heading">Úpravy textů a stránek</h2><p>Veškeré informace na čtyřech důležitých stránkách můžete spravovat přímo tady. Uložení změny ihned publikuje.</p></div><Type size={35} aria-hidden="true"/></div>
  <div className="admin-cms-grid">{pages.map(([id,title],index)=><article className="admin-cms-card" key={id}>
    <span className="admin-cms-number">0{index+1}</span><h3>{title}</h3><p>{id==="doprava-a-platba"?"Doručení, platby, ceny přepravy a vysvětlující texty":id==="obchodni-podminky"?"Právní články, odstavce a podmínky nákupu":id==="ochrana-osobnich-udaju"?"Zpracování údajů, účely, práva a důležité odkazy":"Materiály, popisy výrobků a bezpečnostní informace"}</p>
    <div className="admin-cms-card-actions"><button type="button" className="button blue" onClick={()=>void openPage(id)}><FilePenLine size={17}/> Upravit texty</button><a href={"/"+id} target="_blank" rel="noopener noreferrer" aria-label={"Zobrazit stránku "+title}><ExternalLink size={18}/></a></div>
   </article>)}</div>
  <p className="admin-cms-hint">Ceny dopravců a informace o dostupnosti online plateb zůstávají napojené na skutečné nastavení obchodu, aby editace textů nezpůsobila nesoulad s košíkem.</p>
  <Dialog open={!!page} onOpenChange={open=>{if(!open&&!saving&&(!dirty||window.confirm("Zavřít editor bez uložení změn?"))){setPage(null);setDirty(false);elements.current.clear();}}}>
   <DialogContent className="cms-editor-dialog" onInteractOutside={event=>{if(dirty||saving)event.preventDefault();}}>
    <div className="cms-editor-top"><div><DialogTitle>{page?editablePageNames[page]:"Editor stránky"}</DialogTitle><DialogDescription>Upravujte nadpisy, odstavce, zvýraznění, odkazy a zarovnání. Texty se mění až po uložení.</DialogDescription></div><div className="cms-editor-top-actions"><button type="button" className="button outline" onClick={()=>{if(!preview)flush();setPreview(!preview);}} disabled={loading}><Eye size={16}/>{preview?"Upravit":"Náhled"}</button><a className="button outline" href={page?"/"+page:"#"} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/>Veřejná stránka</a></div></div>
    {loading?<p className="notice">Načítám úplný obsah stránky…</p>:error&&blocks.length===0?<p className="notice error" role="alert">{error}</p>:<>
     {!preview&&<div className="cms-toolbar" role="toolbar" aria-label="Formátování označeného textu">
      <button type="button" title="Tučné" onMouseDown={e=>e.preventDefault()} onClick={()=>format("bold")}><strong>B</strong></button>
      <button type="button" title="Kurzíva" onMouseDown={e=>e.preventDefault()} onClick={()=>format("italic")}><em>I</em></button>
      <button type="button" title="Podtržené" onMouseDown={e=>e.preventDefault()} onClick={()=>format("underline")}><u>U</u></button>
      <button type="button" title="Odkaz" onMouseDown={e=>e.preventDefault()} onClick={()=>{const url=window.prompt("Vložte odkaz (https://, mailto: nebo /):");if(url){if(safeLink(url))format("createLink",url);else toast.error("Neplatný odkaz.");}}}><Link2 size={16}/></button>
      <span className="cms-toolbar-help">Označte text v odstavci, potom zvolte styl.</span>
     </div>}
     <div className="cms-editor-scroll">{preview?<div className="cms-preview"><EditablePageView document={collect()} page={page??undefined}/></div>:<div className="cms-blocks">
      {blocks.map((block,index)=><div className={"cms-block "+(selected===block.key?"cms-block-selected":"")} key={block.key}>
       <div className="cms-block-header"><span className="cms-block-index">{index+1}</span><select aria-label="Typ textu" value={block.kind} disabled={block.kind==="shippingRates"||block.kind==="paymentAvailability"} onChange={e=>updateBlock(block.key,{kind:e.target.value as PageBlock["kind"]})}>{Object.entries(kinds).filter(([value])=>!["shippingRates","paymentAvailability"].includes(value)||value===block.kind).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
       <div className="cms-block-order"><button title="Posunout výše" type="button" disabled={index===0} onClick={()=>move(block.key,-1)}><ArrowUp size={15}/></button><button title="Posunout níže" type="button" disabled={index===blocks.length-1} onClick={()=>move(block.key,1)}><ArrowDown size={15}/></button><button title="Smazat blok" type="button" disabled={block.kind==="h1"&&blocks.filter(b=>b.kind==="h1").length===1} onClick={()=>remove(block.key)}><Trash2 size={15}/></button></div></div>
       {block.kind==="shippingRates"||block.kind==="paymentAvailability"?<p className="cms-dynamic-note">Tento údaj se automaticky synchronizuje s nastavením obchodu. Text a ceny nelze v editoru přepisovat.</p>:<EditableText block={block} register={el=>{if(el)elements.current.set(block.key,el);else elements.current.delete(block.key);}} onFocus={()=>{focus.current=elements.current.get(block.key)??null;setSelected(block.key);}} onBlur={()=>{flush();setDirty(true);}}/>}
       {!["shippingRates","paymentAvailability"].includes(block.kind)&&<div className="cms-block-format"><label>Font <select value={block.font} onChange={e=>updateBlock(block.key,{font:e.target.value as PageBlock["font"]})}><option value="default">Výchozí</option><option value="serif">Patkové</option><option value="sans">Bezpatkové</option></select></label><label>Barva <select value={block.color} onChange={e=>updateBlock(block.key,{color:e.target.value as PageBlock["color"]})}><option value="default">Výchozí</option><option value="ink">Černá</option><option value="muted">Šedá</option><option value="blue">Modrá</option><option value="terracotta">Terakota</option></select></label><label>Velikost <select value={block.size} onChange={e=>updateBlock(block.key,{size:e.target.value as PageBlock["size"]})}><option value="normal">Běžná</option><option value="small">Malá</option><option value="large">Větší</option><option value="xlarge">Velká</option></select></label><div className="cms-align-tools"><button title="Zarovnat vlevo" type="button" aria-pressed={block.align==="left"} onClick={()=>updateBlock(block.key,{align:"left"})}><AlignLeft size={16}/></button><button title="Na střed" type="button" aria-pressed={block.align==="center"} onClick={()=>updateBlock(block.key,{align:"center"})}><AlignCenter size={16}/></button><button title="Vpravo" type="button" aria-pressed={block.align==="right"} onClick={()=>updateBlock(block.key,{align:"right"})}><AlignRight size={16}/></button><button title="Do bloku" type="button" aria-pressed={block.align==="justify"} onClick={()=>updateBlock(block.key,{align:"justify"})}>☷</button></div></div>}
      </div>)}
      <div className="cms-add-block"><button type="button" className="button outline" onClick={()=>add("p")}><Plus size={16}/>Odstavec</button><button type="button" className="button outline" onClick={()=>add("h2")}><Plus size={16}/>Nadpis</button><button type="button" className="button outline" onClick={()=>add("li")}><Plus size={16}/>Seznam</button></div>
     </div>}</div>
     {error&&<p className="cms-error" role="alert">{error}</p>}
     <div className="cms-editor-footer">{version&&<button type="button" className="button outline" disabled={saving} onClick={()=>void restore()}><RotateCcw size={16}/>Vrátit původní znění</button>}<span className="cms-save-status">{dirty?"Máte neuložené změny.":version?"Publikovaná verze.":"Zatím neupravená stránka."}</span><button type="button" className="button blue" disabled={saving||loading||!blocks.length} onClick={()=>void save()}><Save size={17}/>{saving?"Ukládám…":"Uložit a publikovat"}</button></div>
    </>}
   </DialogContent>
  </Dialog>
 </section>;
}
