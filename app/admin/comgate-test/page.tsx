import {isAdmin} from "@/lib/server";
import {redirect} from "next/navigation";
import SandboxClient from "./sandbox-client";
export const dynamic="force-dynamic";
export const metadata={title:"Test Comgate · SádroSvět",robots:{index:false,follow:false}};
export default async function Page(){
 if(!await isAdmin())redirect("/admin");
 return <main style={{maxWidth:700,margin:"3rem auto",padding:"1.5rem"}}>
  <h1>Oddělený test Comgate</h1>
  <p>Tato stránka vytvoří pouze jednu testovací transakci za 10 Kč. Nevytváří zákaznickou objednávku, neodečítá sklad a neodesílá potvrzovací e-mail. Nedochází ke skutečnému stržení peněz, pokud Comgate respektuje testovací režim.</p>
  <p>Ostré platby zákazníků zůstávají vypnuté. Po testu je potřeba samostatně ověřit stav platby a její notifikace.</p>
  <SandboxClient/>
  <p><a href="/admin">Zpět do administrace</a></p>
 </main>;
}
