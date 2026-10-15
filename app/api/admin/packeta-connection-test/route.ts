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
 <email>api-check@example.invalid</email><phone>777123456</phone>
 <addressId>106</addressId><value>100</value><currency>CZK</currency>
 <weight>0.5</weight><eshop>${xml(sender)}</eshop>
 <street>Testovací</street><houseNumber>1</houseNumber><city>Praha</city><zip>11000</zip>
 </packetAttributes></packetAttributesValid>`;
 try{
  const response=await fetch("https://www.zasilkovna.cz/api/rest",{method:"POST",body:payload,headers:{"content-type":"application/xml; charset=utf-8"},cache:"no-store",signal:AbortSignal.timeout(12000)});
  const raw=(await response.text()).slice(0,12000);
  if(!response.ok)return Response.json({ok:false,message:"Zásilkovna vrátila HTTP "+response.status+". Hesla ani technické odpovědi nezobrazujeme."},{status:502});
  if(/<status>ok<\/status>/i.test(raw))return Response.json({ok:true,message:"Zásilkovna přijala validaci. API odpovídá bez vytvoření zásilky."});
  // Validation fault alone cannot be used to certify API access or account permissions.
  return Response.json({ok:false,message:"Odpověď Zásilkovny nepotvrdila úspěšnou validaci. Prověř oprávnění účtu a nastavení odesílatele; žádná zásilka nevznikla."},{status:502});
 }catch{
  return Response.json({ok:false,message:"Se Zásilkovnou se nepodařilo navázat spojení. Žádná zásilka nevznikla."},{status:502});
 }
}
