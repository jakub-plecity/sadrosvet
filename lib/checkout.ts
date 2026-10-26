import {z} from "zod";

export const shippingServices = [
 {id:"personal-pickup",carrier:"Osobní odběr",label:"Na Kopci 1083, Chrudim · po domluvě",priceMinor:0,codMinor:0,demoRate:false,available:true},
 {id:"balikovna-point",carrier:"Balíkovna",label:"Výdejní místo nebo box",priceMinor:8900,codMinor:1900,demoRate:false,available:true},
 {id:"balikovna-address",carrier:"Balíkovna",label:"Doručení na adresu",priceMinor:11900,codMinor:1900,demoRate:false,available:true},
 // Provozovatelem potvrzené konečné prodejní ceny pro zákazníky, nikoli nákupní partnerské tarify.
 {id:"packeta-point",carrier:"Zásilkovna",label:"Výdejní místo nebo Z-BOX",priceMinor:8900,codMinor:2900,demoRate:false,available:true},
 {id:"packeta-address",carrier:"Zásilkovna",label:"Doručení na adresu",priceMinor:12900,codMinor:2900,demoRate:false,available:true},
] as const;
export type ServiceId=typeof shippingServices[number]["id"];
export const pointSchema=z.object({id:z.string().trim().min(1).max(80),name:z.string().trim().min(1).max(160),address:z.string().trim().min(1).max(240),zip:z.string().regex(/^\d{5}$/)}).strict();
export type DeliveryPoint=z.infer<typeof pointSchema>;
export function demoDeliveryPoints(service:ServiceId):DeliveryPoint[]{
 const carrier=shippingServices.find(s=>s.id===service)?.carrier;
 if(!carrier||(service==="balikovna-point"||service==="packeta-point")||!service.endsWith("-point"))return [];
 return ["výdejna","box"].map((kind,i)=>({id:`demo-${service}-${i}`,name:`${carrier} · ukázková ${kind==="box"?"volba boxu":"výdejna"}`,address:"Smyšlené místo pro vyzkoušení košíku",zip:"10000"}));
}
export const deliverySchema=z.object({service:z.enum(["personal-pickup","balikovna-point","balikovna-address","packeta-point","packeta-address"]),payment:z.enum(["cod","cash","comgate"]),point:pointSchema.nullable()}).strict().superRefine((data,ctx)=>{
 if(data.service==="personal-pickup"&&(data.point!==null||!["cash","comgate"].includes(data.payment)))ctx.addIssue({code:"custom",message:"Osobní odběr vyžaduje platbu hotově bez výdejního místa."});
 if(data.service!=="personal-pickup"&&!["cod","comgate"].includes(data.payment))ctx.addIssue({code:"custom",message:"Pro dopravu vyberte dobírku."});
 if(data.service.endsWith("-point")&&!data.point)ctx.addIssue({code:"custom",message:"Vyberte výdejní místo."});
 if(data.service==="packeta-point"&&data.point&&!/^\d+$/.test(data.point.id))ctx.addIssue({code:"custom",message:"Vyberte místo v oficiální mapě Zásilkovny."});
 if(data.service.endsWith("-address")&&data.point)ctx.addIssue({code:"custom",message:"Doručení na adresu nesmí obsahovat výdejní místo."});
 if(data.point&&data.service.endsWith("-point")&&data.service!=="balikovna-point"&&data.service!=="packeta-point"&&!demoDeliveryPoints(data.service).some(p=>p.id===data.point?.id&&p.name===data.point.name&&p.address===data.point.address&&p.zip===data.point.zip))ctx.addIssue({code:"custom",message:"Vyberte zkušební místo odpovídající dopravci."});
});
export type Delivery=z.infer<typeof deliverySchema>;
export const contactSchema=z.object({name:z.string().trim().min(3,"Vyplňte jméno a příjmení.").max(120),email:z.string().trim().email("Zadejte platný e-mail."),phone:z.string().transform(v=>v.replace(/[\s()-]/g,"")).refine(v=>/^(?:\+420|\+421)?[67]\d{8}$/.test(v),"Zadejte české nebo slovenské mobilní číslo.")});
export const addressSchema=z.object({street:z.string().trim().min(2,"Vyplňte ulici.").max(120),house:z.string().trim().min(1,"Vyplňte číslo domu.").max(20),city:z.string().trim().min(2,"Vyplňte město.").max(120),zip:z.string().transform(v=>v.replace(/\s/g,"")).refine(v=>/^[1-7]\d{4}$/.test(v),"Zadejte české PSČ.")});
export function deliveryPrice(service:ServiceId){return shippingServices.find(s=>s.id===service)?.priceMinor??null;}
export function quote(subtotalMinor:number,delivery:Delivery){
 const shippingMinor=deliveryPrice(delivery.service);
 if(shippingMinor===null)throw new Error("Tato doprava zatím není dostupná.");
 const selected=shippingServices.find(s=>s.id===delivery.service)!;
 const codMinor=delivery.payment==="cod"?selected.codMinor:0;
 return {subtotalMinor,shippingMinor,codMinor,totalMinor:subtotalMinor+shippingMinor+codMinor,rateKind:selected.demoRate?"illustrative":"published-tariff"};
}
export function deliveryLabel(raw:string){
 try{const data=JSON.parse(raw);const service=shippingServices.find(s=>s.id===data.service);if(service)return `${service.carrier} · ${service.label}${data.point?` · ${data.point.name} (${data.point.zip})`:""} · ${service.id==="personal-pickup"?"hotově při převzetí":"dobírka"}${data.rateKind==="illustrative"?" · ukázkové ceny":""}`;}catch{}
 return raw==="pickup"?"Dřívější test osobního odběru":raw==="delivery"?"Dřívější test dopravy":raw;
}
