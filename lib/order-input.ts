import {z} from "zod";
import {addressSchema,contactSchema,deliverySchema} from "./checkout";
export const realOrderInput=z.object({
 id:z.string().uuid(),
 contact:contactSchema,
 delivery:deliverySchema,
 shippingAddress:addressSchema.nullable(),
 billingAddress:addressSchema.nullable(),
 company:z.object({name:z.string().trim().min(1).max(160),ico:z.string().regex(/^\\d{8}$/),dic:z.string().trim().max(20)}).strict().nullable(),
 note:z.string().trim().max(1000).default(""),
 expectedTotalMinor:z.number().int().positive().max(5000000),
 items:z.array(z.object({id:z.string().min(1).max(100),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(40)
}).strict().superRefine((v,ctx)=>{
 if(new Set(v.items.map(i=>i.id)).size!==v.items.length)ctx.addIssue({code:"custom",message:"Produkt se v objednávce opakuje."});
 if(v.delivery.service.endsWith("-address")&&!v.shippingAddress)ctx.addIssue({code:"custom",message:"Chybí doručovací adresa."});
 if(!v.delivery.service.endsWith("-address")&&v.shippingAddress)ctx.addIssue({code:"custom",message:"U této dopravy nesmí být doručovací adresa."});
});
export type RealOrderInput=z.infer<typeof realOrderInput>;
