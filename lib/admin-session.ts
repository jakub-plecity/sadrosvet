import {cookies} from "next/headers";
import "server-only";
const env=process.env;
const name="__Host-sadrosvet-admin";
const enc=new TextEncoder();
const secrets=()=>env as unknown as {ADMIN_SESSION_SECRET?:string;LOCAL_ADMIN_USERNAME?:string;LOCAL_ADMIN_PASSWORD?:string};
async function sign(value:string){const secret=secrets().ADMIN_SESSION_SECRET;if(!secret||secret.length<32)throw new Error("Přihlášení není nastavené.");const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");}
export function equal(a:string,b:string){let result=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)result|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return result===0;}
export async function validAdminSession(){try{const token=(await cookies()).get(name)?.value;if(!token)return false;const [expires,nonce,signature,...extra]=token.split(".");if(extra.length||!nonce||!signature||!/^\d+$/.test(expires)||Number(expires)<=Date.now()||Number(expires)>Date.now()+8*3600000)return false;return equal(await sign(`${expires}.${nonce}`),signature);}catch{return false;}}
export async function checkPassword(username:string,password:string){const s=secrets();if(!s.LOCAL_ADMIN_USERNAME||!s.LOCAL_ADMIN_PASSWORD)return false;const a=await sign(`password:${password}`),b=await sign(`password:${s.LOCAL_ADMIN_PASSWORD}`);return equal(username,s.LOCAL_ADMIN_USERNAME)&&equal(a,b);}
export async function createSession(){const value=`${Date.now()+8*3600000}.${crypto.randomUUID()}`;return `${name}=${value}.${await sign(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;}
export function clearSession(){return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;}
export function trustedOrigin(request:Request){
 const origin=request.headers.get("origin");
 if(!origin)return false;
 const accepted=new Set<string>([new URL(request.url).origin]);
 // Behind the Netlify proxy, request.url can use an internal hostname.
 if(process.env.SITE_ORIGIN){
  try{accepted.add(new URL(process.env.SITE_ORIGIN).origin);}catch{}
 }
 // Require a same-origin browser request, including when Netlify forwards the public hostname.
 const forwardedHost=request.headers.get("x-forwarded-host")??request.headers.get("host");
 if(forwardedHost&&/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(forwardedHost)){
  accepted.add(`https://${forwardedHost}`);
  if(forwardedHost.startsWith("localhost:"))accepted.add(`http://${forwardedHost}`);
 }
 return accepted.has(origin);
}
