import {clearSession,trustedOrigin} from "@/lib/admin-session";
export async function POST(request:Request){if(!trustedOrigin(request))return new Response(null,{status:403});return Response.json({ok:true},{headers:{"Set-Cookie":clearSession(),"Cache-Control":"no-store"}});}
