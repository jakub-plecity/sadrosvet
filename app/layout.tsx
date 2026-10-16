import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sadrosvet.cz"),
  title: {default:"SádroSvět | Sádrové dekorace a dekorativní svíčky",template:"%s"},
  description: "SádroSvět nabízí sádrové dekorace, vázy, misky, podnosy a dekorativní svíčky pro váš domov. Prohlédněte si kolekci na sadrosvet.cz.",
  alternates: {canonical:"/"},
  openGraph: {type:"website",locale:"cs_CZ",siteName:"SádroSvět",url:"https://sadrosvet.cz",title:"SádroSvět | Sádrové dekorace",description:"Sádrové dekorace a dekorativní svíčky pro váš domov."},
  icons: {icon:"/logo-sadrosvet.png",shortcut:"/logo-sadrosvet.png"},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="cs"><body className="antialiased">{children}</body></html>;}
