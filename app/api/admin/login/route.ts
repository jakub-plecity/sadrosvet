import {database} from "@/lib/server";
import {checkPassword,createSession,trustedOrigin} from "@/lib/admin-session";
export async function POST(request:Request){
 if(!trustedOrigin(request))return Response.json({error:"Neplatný původ požadavku."},{status:403});
 try{
 const raw=await request.text();if(raw.length>2048)return Response.json({error:"Neplatný požadavek."},{status:400});
 const input=JSON.parse(raw);if(typeof input.username!=="string"||typeof input.password!=="string")return Response.json({error:"Vyplň jméno a heslo."},{status:400});
 const db=database();await db.prepare("CREATE TABLE IF NOT EXISTS admin_login_limits (id TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL)").run();
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(request.headers.get("x-nf-client-connection-ip")??"unknown"));const id=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");const now=Date.now();
 await db.prepare("INSERT INTO admin_login_limits (id,count,expires) VALUES ($1,1,$2) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN admin_login_limits.expires<=$3 THEN 1 ELSE admin_login_limits.count+1 END, expires=CASE WHEN admin_login_limits.expires<=$4 THEN excluded.expires ELSE admin_login_limits.expires END").bind(id,now+900000,now,now).run();
 const limit=await db.prepare("SELECT count FROM admin_login_limits WHERE id=$1").bind(id).first<{count:number}>();if((limit?.count??99)>10)return Response.json({error:"Příliš mnoho pokusů. Zkus to za 15 minut."},{status:429,headers:{"Retry-After":"900"}});
 if(!await checkPassword(input.username,input.password))return Response.json({error:"Nesprávné jméno nebo heslo."},{status:401});
 await db.prepare("DELETE FROM admin_login_limits WHERE id=$1 OR expires<$2").bind(id,now).run();
 return Response.json({ok:true},{headers:{"Set-Cookie":await createSession(),"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Přihlášení se nepodařilo."},{status:503});}
}
