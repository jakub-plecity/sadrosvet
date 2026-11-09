import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sadrosvet.cz"),
  title: {default:"SádroSvět | Ručně vyráběné sádrové dekorace a svíčky",template:"%s"},
  description: "SádroSvět Chrudim: ručně vyráběné sádrové dekorace, misky, vázy, podnosy a dekorativní svíčky. Originální bytové doplňky a dárky z keramické sádry.",
  keywords: ["SádroSvět","Sadrosvet","sadrosvet","sadro svet","sádro svět","sadrosvet chrudim","SádroSvět Chrudim","sadrosvet.cz","sádrové dekorace","sádrové výrobky","ručně vyráběné dekorace","výrobky z keramické sádry","keramická sádra","sádrové misky","sádrové vázy","sádrové podnosy","dekorativní svíčky","bytové dekorace","bytové doplňky","dekorace Chrudim"],
  alternates: {canonical:"/"},
  openGraph: {type:"website",locale:"cs_CZ",siteName:"SádroSvět",url:"https://sadrosvet.cz",title:"SádroSvět Chrudim | Sádrové dekorace",description:"Ručně vyráběné sádrové dekorace, misky, vázy, podnosy a dekorativní svíčky z Chrudimi."},
  icons: {icon:"/logo-sadrosvet.png",shortcut:"/logo-sadrosvet.png"},
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="cs"><body className="antialiased">{children}</body></html>;}
