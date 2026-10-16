import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const origin="https://sadrosvet.cz";
 const pages=["/","/o-nas","/doprava-a-platba","/material-a-bezpecnostni-informace","/vraceni-zbozi","/ochrana-osobnich-udaju","/obchodni-podminky"];
 return pages.map(path=>({url:origin+path,changeFrequency:"monthly" as const,priority:path==="/"?1:0.5}));
}
