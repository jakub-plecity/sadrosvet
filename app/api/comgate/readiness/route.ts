import {comgateConfigured} from "@/lib/comgate";
import {publicOnlinePaymentsEnabled} from "@/lib/payment-availability";
export const dynamic="force-dynamic";
export async function GET(){
 // Intentionally exposes only coarse readiness; never return merchant or secret.
 return Response.json({configured:comgateConfigured(),onlineCheckoutEnabled:publicOnlinePaymentsEnabled(),reason:publicOnlinePaymentsEnabled()?"Online payments are enabled for public checkout; available methods are supplied by Comgate.":"Online payments are not enabled for public checkout."},{headers:{"Cache-Control":"no-store"}});
}
