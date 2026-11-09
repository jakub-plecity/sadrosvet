import {SiteHeader} from "@/components/site-header";
import type { ReactNode } from "react";
import { SiteBrand, SiteFooter } from "@/components/site-footer";
export function LegalPage({title,children,hideTitle=false}:{title:string;children:ReactNode;hideTitle?:boolean}) {
 return <><SiteHeader/><main className="legal-page"><nav className="legal-breadcrumb" aria-label="Drobečková navigace"><a href="/">Úvod</a><span aria-hidden="true">/</span><span>{title}</span></nav>{!hideTitle&&<h1>{title}</h1>}{children}</main><SiteFooter/></>;
}
