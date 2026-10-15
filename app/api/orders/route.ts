import {database,guard,readProducts,failure,runtime} from "@/lib/server";
import {deliverySchema,quote} from "@/lib/checkout";
import {z} from "zod";
export const dynamic="force-dynamic";
export async function GET(){try{const denied=await guard();if(denied)return denied;const {results}=await database().prepare("SELECT * FROM demo_orders ORDER BY created_at DESC LIMIT 100").all();return Response.json({orders:results.map(r=>({id:r.id,items:r.items,totalMinor:r.total_minor,shipping:r.shipping,createdAt:r.created_at}))},{headers:{"Cache-Control":"no-store"}});}catch(e){return failure(e);}}
const orderInput=z.object({id:z.string().uuid(),delivery:deliverySchema,expectedTotalMinor:z.number().int().positive().max(5000000),items:z.array(z.object({id:z.string().min(1).max(100),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(40)}).strict();
export async function POST(request:Request){try{
 const origin=request.headers.get("origin");const trusted=runtime().SITE_ORIGIN??new URL(request.url).origin;
 if(!origin||(origin!==trusted&&origin!==new URL(request.url).origin))return Response.json({error:"Požadavek nepochází z tohoto webu."},{status:403});
 const text=await request.text();if(text.length>12000)return Response.json({error:"Objednávka je příliš velká."},{status:413});
 const input=orderInput.parse(JSON.parse(text));
 if(new Set(input.items.map(i=>i.id)).size!==input.items.length)return Response.json({error:"Produkt je v košíku vícekrát."},{status:400});
 const db=database();
 const existing=await db.prepare("SELECT items,shipping,total_minor FROM demo_orders WHERE id=$1").bind(input.id).first<{items:string;shipping:string;total_minor:number}>();
 if(existing){
  const prior=JSON.parse(existing.items) as {id:string;quantity:number}[];
  const saved=JSON.parse(existing.shipping);
  if(JSON.stringify({service:saved.service,payment:saved.payment,point:saved.point})!==JSON.stringify(input.delivery)||existing.total_minor!==input.expectedTotalMinor||prior.length!==input.items.length||prior.some(p=>!input.items.some(i=>i.id===p.id&&i.quantity===p.quantity)))return Response.json({error:"Tato zkouška už byla uložena s jinými údaji."},{status:409});
  return Response.json({id:input.id,totalMinor:existing.total_minor,demo:true});
 }
 const catalog=await readProducts();
 const items=input.items.map(i=>{const p=catalog.find(p=>p.id===i.id);if(!p||p.stock<i.quantity)throw new Error("Produkt již není dostupný v požadovaném množství.");return {id:p.id,name:p.name,priceMinor:p.priceMinor,quantity:i.quantity};});
 const prices=quote(items.reduce((sum,p)=>sum+p.priceMinor*p.quantity,0),input.delivery);
 if(prices.totalMinor!==input.expectedTotalMinor)return Response.json({error:"Cena zboží se změnila. Obnov stránku a zkontroluj košík před opakováním zkoušky."},{status:409});
 if(prices.totalMinor>5000000)return Response.json({error:"Dobírka je dostupná pouze do 50 000 Kč."},{status:400});
 const shipping=JSON.stringify({...input.delivery,...prices});
 // Public demo writes are bounded and contain no customer contact/address fields.
 const result=await db.prepare("INSERT INTO demo_orders (id,items,total_minor,shipping,created_at) SELECT $1,$2,$3,$4,$5 WHERE (SELECT COUNT(*) FROM demo_orders WHERE created_at>=$6)<200 ON CONFLICT DO NOTHING").bind(input.id,JSON.stringify(items),prices.totalMinor,shipping,new Date().toISOString(),new Date(Date.now()-86400000).toISOString()).run();
 if(!result.meta.changes){
  const saved=await db.prepare("SELECT total_minor,shipping,items FROM demo_orders WHERE id=$1").bind(input.id).first<{total_minor:number;shipping:string;items:string}>();
  if(!saved)return Response.json({error:"Dnešní limit zkušebních objednávek byl vyčerpán. Zkus to později."},{status:429});
  if(saved.items!==JSON.stringify(items)||saved.shipping!==shipping)return Response.json({error:"Zkouška už byla uložena s jinými údaji."},{status:409});
 }
 return Response.json({id:input.id,...prices,demo:true},{status:201});
}catch(e){if(e instanceof z.ZodError||e instanceof SyntaxError)return Response.json({error:"Zkontroluj obsah košíku, dopravu a vybrané místo."},{status:400});if(e instanceof Error&&e.message.includes("dostupný"))return Response.json({error:e.message},{status:409});return failure(e);}}
