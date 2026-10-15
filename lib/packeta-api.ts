import "server-only";
const endpoint="https://www.zasilkovna.cz/api/rest";
const esc=(v:unknown)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const node=(key:string,val:unknown)=>`<${key}>${esc(val)}</${key}>`;
const inner=(xml:string,tag:string)=>{const r=new RegExp("<(?:[A-Za-z0-9_-]+:)?"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?"+tag+">","i");return r.exec(xml)?.[1]??"";};
const decode=(v:string)=>v.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
export class PacketaError extends Error {}
async function call(method:"createPacket"|"packetLabelPdf",args:string){
 const password=process.env.PACKETA_API_PASSWORD;
 if(!password)throw new PacketaError("Na Netlify chybí PACKETA_API_PASSWORD (heslo partnerského API).");
 const body=`<?xml version="1.0" encoding="UTF-8"?><${method}>${node("apiPassword",password)}${args}</${method}>`;
 const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/xml; charset=utf-8"},body,cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new PacketaError("Zásilkovna odmítla API požadavek.");
 const raw=await response.text();if(raw.length>2000000)throw new PacketaError("Odpověď API je příliš velká.");
 if(inner(raw,"status").trim()!=="ok")throw new PacketaError("Zásilkovna vrátila chybu. Zkontroluj partnerský účet a zadané údaje.");
 return raw;
}
export async function createPacketaPacket(input:{
 number:string;name:string;surname:string;email:string;phone:string;addressId:string;
 cod:number;value:number;weightGrams:number;company?:string;
 street?:string;house?:string;city?:string;zip?:string;
}){
 const sender=process.env.PACKETA_SENDER_INDICATION;
 if(!sender)throw new PacketaError("Chybí PACKETA_SENDER_INDICATION z klientské sekce Zásilkovny.");
 const fields=[
 node("number",input.number),node("name",input.name),node("surname",input.surname),
 node("email",input.email),node("phone",input.phone),node("addressId",input.addressId),
 node("cod",input.cod.toFixed(2)),node("value",input.value.toFixed(2)),
 node("currency","CZK"),node("weight",(input.weightGrams/1000).toFixed(3)),
 node("eshop",sender),
 input.company?node("company",input.company):"",
 input.street?node("street",input.street):"",input.house?node("houseNumber",input.house):"",
 input.city?node("city",input.city):"",input.zip?node("zip",input.zip):""
 ].join("");
 const raw=await call("createPacket",`<packetAttributes>${fields}</packetAttributes>`);
 const result=inner(raw,"result");
 const id=decode(inner(result,"id")).trim(),barcode=decode(inner(result,"barcode")).trim();
 if(!/^\d{4,20}$/.test(id)||!/^Z[0-9]{4,20}$/.test(barcode))throw new PacketaError("Zásilkovna vrátila neúplnou odpověď. Zásilku nejprve prověř v klientské sekci.");
 return {id,barcode};
}
export async function packetaLabelPdf(packetId:string){
 if(!/^\d{4,20}$/.test(packetId))throw new PacketaError("Neplatné číslo zásilky.");
 const raw=await call("packetLabelPdf",node("packetId",packetId)+node("format","A6 on A6")+node("offset",0));
 const encoded=inner(raw,"result").replace(/\s/g,"");
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)||encoded.length>1800000)throw new PacketaError("Štítek není dostupný.");
 const binary=Buffer.from(encoded,"base64");
 if(binary.length<30||binary.subarray(0,5).toString("ascii")!=="%PDF-")throw new PacketaError("Zásilkovna nevrátila platné PDF.");
 return binary;
}
