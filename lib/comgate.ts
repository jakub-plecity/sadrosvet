import "server-only";
/**
 * Server-only Comgate Merchant API (HTTP POST v1.0).
 * Do not expose merchant credentials to the browser.
 * Creating a payment is NOT proof of payment; always verify /status.
 */
const BASE="https://payments.comgate.cz/v1.0";
export function comgateConfigured(){return Boolean(process.env.COMGATE_MERCHANT?.trim()&&process.env.COMGATE_SECRET?.trim());}
function credentials(){
 const merchant=process.env.COMGATE_MERCHANT?.trim(),secret=process.env.COMGATE_SECRET?.trim();
 if(!merchant||!secret)throw new Error("Comgate není nakonfigurována.");
 return {merchant,secret};
}
async function post(path:"create"|"status",data:Record<string,string>){
 const {merchant,secret}=credentials();
 const form=new URLSearchParams({merchant,secret,...data});
 const response=await fetch(`${BASE}/${path}`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/x-www-form-urlencoded"},body:form,cache:"no-store",signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error("Comgate API is unavailable.");
 const values=new URLSearchParams(await response.text());
 if(values.get("code")!=="0")throw new Error(`Comgate rejected ${path} (code ${values.get("code")??"unknown"}).`);
 return values;
}
export async function createComgatePayment(order:{orderNumber:string;priceMinor:number;email:string;name:string;service:string},test=true){
 if(!Number.isSafeInteger(order.priceMinor)||order.priceMinor<1000)throw new Error("Invalid payment amount.");
 const params={test:test?"true":"false",price:String(order.priceMinor),curr:"CZK",label:"SadroSvet",refId:order.orderNumber,method:"ALL",country:"CZ",email:order.email,fullName:order.name,delivery:order.service.endsWith("-point")?"PICKUP_POINT":"HOME_DELIVERY",category:"PHYSICAL_GOODS_ONLY",prepareOnly:"true"};
 const result=await post("create",params);
 const redirect=result.get("redirect"),transId=result.get("transId");
 if(!redirect||!transId)throw new Error("Comgate did not return transaction details.");
 const url=new URL(redirect);
 if(url.protocol!=="https:"||url.hostname!=="payments.comgate.cz")throw new Error("Untrusted payment URL from Comgate.");
 return {transId,redirect:url.toString()};
}
export async function verifyComgatePayment(transId:string){
 if(!/^[a-zA-Z0-9-]{6,64}$/.test(transId))throw new Error("Invalid Comgate transaction ID.");
 const result=await post("status",{transId});
 return {transId:result.get("transId"),status:result.get("status"),refId:result.get("refId"),priceMinor:Number(result.get("price")),currency:result.get("curr"),test:result.get("test")==="true"};
}
