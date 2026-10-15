import {SiteHeader} from "@/components/site-header";
import type { ReactNode } from "react";
import { SiteBrand, SiteFooter } from "@/components/site-footer";
export function LegalPage({title,children}:{title:string;children:ReactNode}) {
 return <><SiteHeader/><main className="legal-page"><nav className="legal-breadcrumb" aria-label="Drobečková navigace"><a href="/">Úvod</a><span aria-hidden="true">/</span><span>{title}</span></nav><h1>{title}</h1>{children}</main><SiteFooter/></>;
}
