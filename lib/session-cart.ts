export const CART_SESSION_KEY="sadrosvet:cart:v1";
export function parseSessionCart(raw:string|null):Record<string,number>{
 if(!raw)return {};
 try {const value:unknown=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))return {};
 return Object.fromEntries(Object.entries(value).filter(([id,q])=>id.length>0&&id.length<=100&&typeof q==="number"&&Number.isInteger(q)&&q>=1&&q<=10).slice(0,40));}catch{return {};}
}
export function readSessionCart(){try{return parseSessionCart(window.sessionStorage.getItem(CART_SESSION_KEY));}catch{return {};}}
export function saveSessionCart(cart:Record<string,number>){try{if(Object.keys(cart).length)window.sessionStorage.setItem(CART_SESSION_KEY,JSON.stringify(cart));else window.sessionStorage.removeItem(CART_SESSION_KEY);window.dispatchEvent(new Event("sadrosvet:cart-change"));}catch{}}
