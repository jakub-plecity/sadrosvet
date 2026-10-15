import {guard} from "@/lib/server";
export const dynamic="force-dynamic";
const xml=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 const password=process.env.PACKETA_API_PASSWORD?.trim();
 const sender=process.env.PACKETA_SENDER_INDICATION?.trim();
 if(!password||!sender)return Response.json({ok:false,code:"MISSING_CONFIG",message:"Chybí heslo API nebo označení odesílatele."},{status:503});
 // Read-only official Packeta API method. Unlike packetAttributesValid, this does not
 // depend on invented parcel/customer data and never creates a shipment.
 const payload=`<?xml version="1.0" encoding="UTF-8"?><senderGetReturnRouting><apiPassword>${xml(password)}</apiPassword><senderLabel>${xml(sender)}</senderLabel></senderGetReturnRouting>`;
 try{
  const response=await fetch("https://www.zasilkovna.cz/api/rest",{method:"POST",body:payload,headers:{"content-type":"application/xml; charset=utf-8"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  // Do not expose/log raw API response: it may contain private sender account details.
  const raw=(await response.text()).slice(0,12000);
  if(!response.ok)return Response.json({ok:false,code:"HTTP_ERROR",message:"Zásilkovna vrátila HTTP "+response.status+". Ověř dostupnost API."},{status:502});
  const status=new RegExp("<status>\\s*(ok|fault)\\s*</status>","i").exec(raw)?.[1]?.toLowerCase();
  if(status==="ok")return Response.json({ok:true,code:"SENDER_VERIFIED",message:"Připojení funguje. Zásilkovna potvrdila heslo API i existujícího odesílatele. Zásilka nebyla vytvořena."});
  const faultCode=new RegExp("<faultCode>\\s*([^<]{1,80})\\s*</faultCode>","i").exec(raw)?.[1]?.trim()??"";
  const known=/(IncorrectApiPasswordFault|SenderNotExists|InvalidSenderFault|InvalidEshopFault)/i.exec(raw)?.[1]??"";
  const code=/IncorrectApiPassword/i.test(known+" "+faultCode)?"INVALID_API_PASSWORD":/SenderNotExists|InvalidSender|InvalidEshop/i.test(known+" "+faultCode)?"UNKNOWN_SENDER":"API_REJECTED";
  return Response.json({ok:false,code,message:code==="INVALID_API_PASSWORD"?"Zásilkovna odmítla heslo partnerského API.":code==="UNKNOWN_SENDER"?"Zásilkovna nenašla odesílatele. Ověř přesnou hodnotu Sender Indication.":"Zásilkovna odmítla test odesílatele nebo vrátila neznámou odpověď. Ověř parametry účtu; žádnou zásilku jsme nevytvořili."},{status:502});
 }catch{return Response.json({ok:false,code:"NETWORK_ERROR",message:"Spojení s API Zásilkovny se nezdařilo. Žádná zásilka nevznikla."},{status:502});}
}
