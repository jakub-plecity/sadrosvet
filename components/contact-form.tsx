"use client";
import {useRef,useState,type FormEvent} from "react";

export function ContactForm(){
 const sending=useRef(false);
 const attempt=useRef({signature:"",id:""});
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState<{kind:"success"|"error";text:string}|null>(null);
 async function send(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(sending.current)return;
  const form=event.currentTarget;
  const data=new FormData(form);
  const payload=Object.fromEntries(Array.from(data.entries(),([key,value])=>[key,String(value).trim()]));
  if(!payload.name||!payload.email||!payload._subject||!payload.message){setStatus({kind:"error",text:"Vyplň prosím všechna pole."});return;}
  const signature=JSON.stringify(payload);if(attempt.current.signature!==signature)attempt.current={signature,id:crypto.randomUUID()};
  sending.current=true;setBusy(true);setStatus(null);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({...payload,id:attempt.current.id}),signal:controller.signal});
   const result=await response.json() as {success?:boolean|string;message?:string};
   if(!response.ok)throw new Error("submission_failed");
   if(result.success===true){setStatus({kind:"success",text:"Děkujeme. Zpráva byla přijata k odeslání na sadrosvet@seznam.cz."});form.reset();attempt.current={signature:"",id:""};}else{throw new Error("submission_failed");}
  }catch{
   setStatus({kind:"error",text:"Odeslání se nepodařilo potvrdit. Text zůstal zachovaný. Zkus to prosím později, nebo napiš na sadrosvet@seznam.cz."});
  }finally{clearTimeout(timeout);sending.current=false;setBusy(false);}
 }

 return <section id="o-znacce" className="brand-section contact-section">
  <div><span className="eyebrow">KONTAKT</span><h2>Napiš nám.</h2><p>Máš dotaz k dekoracím nebo zájem o výrobu na přání? Napiš nám. Provedení, cenu, platbu a termín dohodneme individuálně. Odesláním poptávky se nezavazuješ k nákupu.</p></div>
  <form className="contact-form" onSubmit={send} aria-busy={busy}>
   <div className="contact-honeypot" aria-hidden="true"><label>Web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
   <fieldset disabled={busy} className="contact-form-fields"><div className="contact-fields">
    <label htmlFor="contact-name">Jméno<input id="contact-name" name="name" autoComplete="name" required maxLength={100}/></label>
    <label htmlFor="contact-email">Tvůj e-mail<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254}/></label>
   </div>
   <label htmlFor="contact-subject">Předmět<input id="contact-subject" name="_subject" required maxLength={150} placeholder="S čím ti můžeme pomoci?"/></label>
   <label htmlFor="contact-message">Zpráva<textarea id="contact-message" name="message" required maxLength={3000} rows={5} placeholder="Napiš nám svůj dotaz nebo přání…"/></label>
   </fieldset><p className="muted">Zprávu doručíme na sadrosvet@seznam.cz. <a href="/ochrana-osobnich-udaju">Jak zpracováváme osobní údaje</a></p><button type="submit" className="button" disabled={busy}>{busy?"Odesíláme…":"Odeslat"}</button>
   {status&&<p className="contact-notice" role={status.kind==="error"?"alert":"status"}>{status.text}</p>}
  </form>
 </section>;
}
