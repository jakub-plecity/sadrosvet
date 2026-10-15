import {guard} from "@/lib/server";
export const dynamic="force-dynamic";
export async function GET(){
 // Navigation GET requests do not normally include an Origin header.
 const denied=await guard();if(denied)return denied;
 const password=!!process.env.PACKETA_API_PASSWORD?.trim();
 const sender=!!process.env.PACKETA_SENDER_INDICATION?.trim();
 const homeId=process.env.PACKETA_HOME_DELIVERY_CARRIER_ID?.trim()??"";
 return Response.json({
   merchantApiPasswordConfigured:password,
   senderIndicationConfigured:sender,
   homeDeliveryCarrierIdConfigured:/^[0-9]+$/.test(homeId),
   pickupApiReadyForLiveTest:password&&sender,
   homeDeliveryAutomaticLabelsReady:false,
   liveApiAuthenticationTested:false,
   explanation:"Tento endpoint bezpečně ověřuje pouze existenci nastavení. Neodesílá požadavek Zásilkovně, nevytváří zásilky a nikdy nezobrazuje tajné hodnoty."
 },{headers:{"Cache-Control":"private, no-store"}});
}
