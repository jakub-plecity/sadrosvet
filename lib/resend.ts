import "server-only";
const env=process.env;
export type MailSettings={RESEND_API_KEY?:string;ORDER_EMAIL_FROM?:string;ORDER_EMAIL_REPLY_TO?:string};
export const mailSettings=()=>env as unknown as MailSettings;
export async function sendEmail({to,subject,text,idempotencyKey,replyTo}:{to:string;subject:string;text:string;idempotencyKey:string;replyTo?:string}){
 const cfg=mailSettings();if(!cfg.RESEND_API_KEY||!cfg.ORDER_EMAIL_FROM)throw new Error("Resend nemá nastavený API klíč nebo odesílatele.");
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${cfg.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},body:JSON.stringify({from:cfg.ORDER_EMAIL_FROM,to:[to],subject,text,reply_to:replyTo??cfg.ORDER_EMAIL_REPLY_TO}),signal:AbortSignal.timeout(15000)});
 const data=await response.json() as {id?:string;name?:string};
 if(!response.ok){if(response.status===401)throw new Error("Resend odmítl API klíč. Ověř platnost klíče.");if(response.status===403||response.status===422)throw new Error("Resend odmítl odesílatele nebo příjemce. Ověř doménu sadrosvet.cz a oprávnění API klíče v Resend.");if(response.status===429)throw new Error("Resend dosáhl limitu. Zkus odeslání později.");throw new Error("Resend zprávu nepřijal. Zkontroluj záznamy v Resend.");}
 if(!data.id)throw new Error("Resend nepotvrdil přijetí zprávy.");return data.id;
}
