import {LegalPage} from "@/components/legal-page";
import type {Metadata} from "next";
export const metadata:Metadata={title:'Materiál a bezpečnostní informace · SádroSvět'};
export default function Page(){return <LegalPage title="Materiál a bezpečnostní informace"><div className="information-placeholder" aria-label="Obsah stránky bude doplněn"/></LegalPage>;}
