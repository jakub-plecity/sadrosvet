import {guard} from "@/lib/server";
export const dynamic="force-dynamic";
const xml=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function POST(request:Request){
 const denied=await guard(request);if(denied)return denied;
 const password=process.env.PACKETA_API_PASSWORD?.trim();
 const sender=process.env.PACKETA_SENDER_INDICATION?.trim();
 if(!password||!sender)return Response.json({ok:false,message:"Na Netlify chybí heslo API nebo označení odesílatele."},{status:503});
 // Official packetAttributesValid API only validates input; it does NOT create a shipment.
 const payload=`<?xml version="1.0" encoding="UTF-8"?><packetAttributesValid>
 <apiPassword>${xml(password)}</apiPassword><packetAttributes>
 <number>SS-CONNECTION-CHECK</number><name>Test</name><surname>API</surname>
 <email>example@packetatest.com</email><phone>+420777123456</phone>
 <addressId>106</addressId><value>100</value><currency>CZK</currency>
 <weight>0.5</weight><eshop>${xml(sender)}</eshop>
 <street>Testovací</street><houseNumber>1</houseNumber><city>Praha</city><zip>11000</zip>
 </packetAttributes></packetAttributesValid>`;
 try{
  const response=await fetch("https://www.zasilkovna.cz/api/rest",{method:"POST",body:payload,headers:{"content-type":"application/xml; charset=utf-8"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  const raw=(await response.text()).slice(0,12000);
  if(!response.ok)return Response.json({ok:false,message:"Zásilkovna vrátila HTTP "+response.status+". Hesla ani technické odpovědi nezobrazujeme."},{status:502});
  if(/<status>\s*ok\s*<\/status>/i.test(raw))return Response.json({ok:true,code:"VALIDATION_OK",message:"Zásilkovna přijala validaci. API odpovídá bez vytvoření zásilky."});
  // Never show the raw Packeta response: it can contain submitted personal or credential data.
  const errorTag=(raw.match(/<(?:[\\w-]+:)?(IncorrectApiPasswordFault|PacketAttributesFault|InvalidEshopFault|InvalidSenderFault|AccessDeniedFault)(?:\\s|>)/i)||[])[1];
  const code=errorTag==="IncorrectApiPasswordFault"?"INVALID_API_PASSWORD":errorTag==="PacketAttributesFault"?"TEST_ATTRIBUTES_REJECTED":errorTag?"ACCOUNT_OR_SENDER_REJECTED":/\bfault\b|<status>\s*fault\s*<\/status>/i.test(raw)?"API_RETURNED_FAULT":"UNEXPECTED_RESPONSE";
  const message=code==="INVALID_API_PASSWORD"?"Zásilkovna odmítla heslo partnerského API. Zkontroluj PACKETA_API_PASSWORD.":code==="TEST_ATTRIBUTES_REJECTED"?"Spojení funguje, ale Zásilkovna odmítla některý testovací údaj zásilky. To samo o sobě neprokazuje chybné heslo.":code==="ACCOUNT_OR_SENDER_REJECTED"?"API odmítlo odesílatele nebo oprávnění firemního účtu. Zkontroluj Sender Indication.":"Zásilkovna vrátila chybu nebo neočekávaný formát. Přihlašovací údaje nemůžeme potvrdit.";
  return Response.json({ok:false,code,message,shipmentCreated:false},{status:502});
 }catch{
  return Response.json({ok:false,message:"Se Zásilkovnou se nepodařilo navázat spojení. Žádná zásilka nevznikla."},{status:502});
 }
}
