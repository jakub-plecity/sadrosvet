import {pointSchema} from './checkout';
export function normalizePacketaPoint(value:unknown){
 if(!value||typeof value!=="object")return null;
 const p=value as Record<string,unknown>;
 if(p.country&&String(p.country).toLowerCase()!=="cz")return null;
 const id=String(p.id??"");if(!/^\d+$/.test(id))return null;
 const street=String(p.street??"").trim(),city=String(p.city??"").trim(),zip=String(p.zip??"").replace(/\s/g,"");
 const address=[street,city].filter(Boolean).join(", ");
 const parsed=pointSchema.safeParse({id,name:String(p.name??""),address,zip});return parsed.success?parsed.data:null;
}
