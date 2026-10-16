import {comgateConfigured} from "@/lib/comgate";
export const dynamic="force-dynamic";
export async function GET(){
 // Intentionally exposes only coarse readiness; never return merchant or secret.
 return Response.json({configured:comgateConfigured(),onlineCheckoutEnabled:false,reason:"Payment transaction persistence and verified callbacks must be completed before enablement."},{headers:{"Cache-Control":"no-store"}});
}
