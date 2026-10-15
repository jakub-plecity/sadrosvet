import {database} from "@/lib/server";
import {sendEmail} from "@/lib/resend";
import {contactInput,contactMail} from "@/lib/contact-input";
export async function POST(request:Request){
 if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"Neplatný původ požadavku."},{status:403});
 try{const raw=await request.text();if(raw.length>18000)return Response.json({message:"Zpráva je příliš dlouhá."},{status:413});const parsed=contactInput.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({message:"Zkontroluj jméno, e-mail, předmět a zprávu."},{status:400});const input=parsed.data;if(input.website)return Response.json({success:true});
 const db=database(),now=Date.now();await db.prepare("CREATE TABLE IF NOT EXISTS contact_rate_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL)").run();
 const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(request.headers.get("x-nf-client-connection-ip")??"unknown"));const ip=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
 const reserve=(id:string,expiry:number)=>db.prepare("INSERT INTO contact_rate_limits (id,count,expires) VALUES ($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN contact_rate_limits.expires<=$3 THEN 1 ELSE contact_rate_limits.count+1 END,expires=CASE WHEN contact_rate_limits.expires<=$4 THEN excluded.expires ELSE contact_rate_limits.expires END").bind(id,expiry,now,now);
 await db.batch([reserve(ip,now+900000),reserve('global',now+86400000)]);
 const limits=await db.prepare("SELECT id,count FROM contact_rate_limits WHERE id IN ($1,'global')").bind(ip).all<{id:string;count:number}>();if(limits.results.some(x=>x.count>(x.id==='global'?100:5)))return Response.json({message:"Byl dosažen limit zpráv. Zkus to později, nebo napiš přímo na sadrosvet@seznam.cz."},{status:429});
 await sendEmail({...contactMail(input),idempotencyKey:`contact-${input.id}`});
 await db.prepare("DELETE FROM contact_rate_limits WHERE expires<$1").bind(now).run();
 return Response.json({success:true,message:"Děkujeme. Zpráva byla přijata k odeslání."},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({message:"Odeslání se nepodařilo potvrdit. Zkus to později nebo napiš na sadrosvet@seznam.cz."},{status:502});}
}
