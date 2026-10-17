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
export async function createComgatePayment(order:{orderNumber:string;priceMinor:number;email:string;name:string;service:string}){
 if(!Number.isSafeInteger(order.priceMinor)||order.priceMinor<1000)throw new Error("Invalid payment amount.");
 const test=process.env.COMGATE_TEST==="false"?"false":"true";
 const params={test,price:String(order.priceMinor),curr:"CZK",label:"SadroSvet",refId:order.orderNumber,method:"ALL",country:"CZ",email:order.email,fullName:order.name,delivery:order.service.endsWith("-point")||order.service==="personal-pickup"?"PICKUP":"HOME_DELIVERY",category:"PHYSICAL_GOODS_ONLY",prepareOnly:"true"};
 const result=await post("create",params);
 const redirect=result.get("redirect"),transId=result.get("transId");
 if(!redirect||!transId)throw new Error("Comgate did not return transaction details.");
 const url=new URL(redirect);
 if(url.protocol!=="https:"||!(url.hostname==="payments.comgate.cz"||url.hostname.endsWith(".comgate.cz")))throw new Error("Untrusted payment URL from Comgate.");
 return {transId,redirect:url.toString()};
}
export async function verifyComgatePayment(transId:string){
 if(!/^[a-zA-Z0-9-]{6,64}$/.test(transId))throw new Error("Invalid Comgate transaction ID.");
 const result=await post("status",{transId});
 const priceRaw=result.get("price"); const testRaw=result.get("test"); const merchant=result.get("merchant");
 if(!priceRaw||!/^\\d+$/.test(priceRaw)||!["true","false"].includes(testRaw??"")||!merchant||merchant!==process.env.COMGATE_MERCHANT?.trim())
  throw new Error("Comgate status response lacks verified merchant, price or test flag.");
 const priceMinor=Number(priceRaw);
 if(!Number.isSafeInteger(priceMinor)||priceMinor<=0)throw new Error("Comgate returned invalid payment amount.");
 return {transId:result.get("transId"),status:result.get("status"),refId:result.get("refId"),priceMinor,currency:result.get("curr"),test:testRaw==="true"};
}

/** Verify configured Merchant API credentials without creating a payment. */
export async function probeComgateConnection(){
 const {merchant,secret}=credentials();
 let response:Response;
 try{
  response=await fetch(BASE+"/methods",{
   method:"POST",
   headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/x-www-form-urlencoded"},
   body:new URLSearchParams({merchant,secret,type:"json",curr:"CZK",lang:"cs"}),
   cache:"no-store",signal:AbortSignal.timeout(12000)
  });
 }catch{ return {connected:false,diagnostic:"NETWORK_ERROR",methods:0};}
 const status=response.status;
 if(!response.ok)return {connected:false,diagnostic:"HTTP_"+status,methods:0};
 const raw=(await response.text()).slice(0,150000);
 let parsed:unknown;
 try{parsed=JSON.parse(raw)}catch{
  const code=new URLSearchParams(raw).get("code");
  return {connected:false,diagnostic:code&&/^\\d{1,5}$/.test(code)?"COMGATE_"+code:"INVALID_RESPONSE",methods:0};
 }
 if(!parsed||typeof parsed!=="object")return {connected:false,diagnostic:"INVALID_RESPONSE",methods:0};
 const obj=parsed as {methods?:unknown;code?:unknown};
 if(typeof obj.code==="number"&&obj.code!==0)return {connected:false,diagnostic:"COMGATE_"+obj.code,methods:0};
 if(typeof obj.code==="string"&&/^\\d{1,5}$/.test(obj.code)&&obj.code!=="0")return {connected:false,diagnostic:"COMGATE_"+obj.code,methods:0};
 if(!Array.isArray(obj.methods))return {connected:false,diagnostic:"INVALID_RESPONSE",methods:0};
 return {connected:true,diagnostic:"OK",methods:obj.methods.length};
}
