import Link from "next/link";
import {SiteHeader} from "@/components/site-header";
import {SiteFooter} from "@/components/site-footer";
export default function NotFound(){return <><SiteHeader/><main className="legal-page"><h1>Tuto stránku jsme nenašli</h1><p>Odkaz může být neplatný nebo byla stránka přesunuta. Výrobky najdete v našem katalogu.</p><Link className="button blue" href="/#kolekce">Přejít do katalogu</Link></main><SiteFooter/></>;}
