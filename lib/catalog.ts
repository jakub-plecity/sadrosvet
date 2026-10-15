export type Product = {id:string; name:string; description:string; category:string; priceMinor:number; stock:number; image:string; images?:string[]; status:"active"|"draft"|"archived"; sample:number; revision:number; updatedAt:string};
export type DemoOrder = {id:string; items:string; totalMinor:number; shipping:string; createdAt:string};
export const catalogCategories = ["Vázy", "Misky", "Podnosy", "Vonné svíčky", "Sety"];
export const money = (minor:number) => new Intl.NumberFormat("cs-CZ", {style:"currency",currency:"CZK", minimumFractionDigits:0, maximumFractionDigits:2}).format(minor/100);
const initialSamples:Product[] = [
 {id:"sample-vase", name:"Váza Linie",category:"Vázy",priceMinor:29000,stock:8,image:"/collection.png",status:"active",sample:1,revision:1,updatedAt:"",description:"Ukázková žebrovaná dekorativní váza. Název, cena a dostupnost slouží k vyzkoušení katalogu; skutečné parametry doplní SádroSvět."},
 {id:"sample-shell",name:"Miska Mušle",category:"Misky",priceMinor:19000,stock:12,image:"/collection.png",status:"active",sample:1,revision:1,updatedAt:"",description:"Ukázková odkládací miska na šperky a drobnosti. Ilustrační vizualizace, nikoli fotografie skutečného výrobku SádroSvět."},
 {id:"sample-tray",name:"Podnos Oblouk",category:"Podnosy",priceMinor:25000,stock:5,image:"/collection.png",status:"active",sample:1,revision:1,updatedAt:"",description:"Ukázkový oválný dekorativní podnos. Rozměry, materiálovou specifikaci a způsob údržby doplní prodejce."},
 {id:"sample-candle",name:"Vonná svíčka Forma",category:"Vonné svíčky",priceMinor:22000,stock:0,image:"/collection.png",status:"active",sample:1,revision:1,updatedAt:"",description:"Ukázková vonná svíčka pro návrh katalogu. Vůni, složení a bezpečnostní informace doplní prodejce."}
];

const demoItems:Pick<Product,"id"|"name"|"description"|"category"|"priceMinor"|"stock">[] = [
 {id:"sample-vase-mini",name:"Váza Linie Mini",category:"Vázy",priceMinor:19000,stock:14,description:"Malá žebrovaná váza pro sušené květiny a úzkou poličku. Ilustrační výška 10 cm."},
 {id:"sample-vase-maxi",name:"Váza Linie Maxi",category:"Vázy",priceMinor:39000,stock:4,description:"Větší dekorativní váza jako výrazný detail na komodu. Ilustrační výška 22 cm; pro suché aranžmá."},
 {id:"sample-vase-natural",name:"Váza Přírodní",category:"Vázy",priceMinor:32000,stock:0,description:"Dekorativní váza v přírodním světlém odstínu. Ilustrační výška 16 cm; určená pro sušené stonky."},
 {id:"sample-bowl-pearl",name:"Miska Perla",category:"Misky",priceMinor:16000,stock:18,description:"Drobná odkládací miska na prstýnky, náušnice a další maličkosti. Ilustrační rozměr 10 × 8 cm."},
 {id:"sample-bowl-shell-mini",name:"Miska Mušle Mini",category:"Misky",priceMinor:14000,stock:9,description:"Menší mušlová miska na šperky u zrcadla nebo na noční stolek. Ilustrační rozměr 11 × 9 cm."},
 {id:"sample-bowl-shell-maxi",name:"Miska Mušle Maxi",category:"Misky",priceMinor:26000,stock:3,description:"Prostornější mušlová miska na drobnosti. Ilustrační rozměr 18 × 15 cm; dekorace bez určení pro potraviny."},
 {id:"sample-tray-mini",name:"Podnos Oblouk Mini",category:"Podnosy",priceMinor:18000,stock:10,description:"Kompaktní oválný podnos na klíče a šperky. Ilustrační rozměr 16 × 9 cm."},
 {id:"sample-tray-maxi",name:"Podnos Oblouk Maxi",category:"Podnosy",priceMinor:34000,stock:6,description:"Větší oválný podnos pro uspořádání dekorací na komodě. Ilustrační rozměr 28 × 14 cm."},
 {id:"sample-tray-stone",name:"Podnos Kámen",category:"Podnosy",priceMinor:29000,stock:1,description:"Dekorativní odkládací podnos v kamenném odstínu. Ilustrační rozměr 22 × 12 cm."},
 {id:"sample-candle-vanilla",name:"Vonná svíčka Vanilka",category:"Vonné svíčky",priceMinor:24000,stock:12,description:"Ukázka svíčky s jemnou vanilkovou vůní pro klidný večer. Ilustrační náplň 120 g; složení a doba hoření nejsou potvrzené."},
 {id:"sample-candle-lavender",name:"Vonná svíčka Levandule",category:"Vonné svíčky",priceMinor:26000,stock:7,description:"Ukázka svíčky s levandulovou vůní ve světlé nádobě. Ilustrační náplň 150 g; složení a doba hoření nejsou potvrzené."},
 {id:"sample-candle-cotton",name:"Vonná svíčka Bavlna",category:"Vonné svíčky",priceMinor:28000,stock:0,description:"Ukázka svíčky s vůní čisté bavlny. Ilustrační náplň 180 g; vůni, složení a bezpečnostní údaje doplní prodejce."},
 {id:"sample-set-home",name:"Set Domov",category:"Sety",priceMinor:59000,stock:5,description:"Ukázková sada tří dekorací: váza Linie Mini, miska Mušle Mini a podnos Oblouk Mini. Jedna položka v košíku představuje celý set."},
 {id:"sample-set-jewels",name:"Set Šperkovnice",category:"Sety",priceMinor:39000,stock:8,description:"Ukázková dvojice odkládacích dekorací: miska Perla a podnos Oblouk Mini. Pro drobnosti na toaletním stolku."},
 {id:"sample-set-evening",name:"Set Klidný večer",category:"Sety",priceMinor:49000,stock:3,description:"Ukázkový set podnosu Oblouk a vonné svíčky Vanilka. Složení a případná obalová úprava sady jsou ilustrační."},
 {id:"sample-set-gift",name:"Dárkový set SádroSvět",category:"Sety",priceMinor:79000,stock:2,description:"Ukázková dárková sada: váza Linie, miska Mušle a podnos Oblouk. Balení ani uvedená kombinace zatím nejsou skutečnou nabídkou."}
];
export const additionalSamples:Product[] = demoItems.map(p=>({...p,
 description:p.description+" Demo produkt: název, cena, parametry i dostupnost slouží k vyzkoušení katalogu.",
 image:p.category==="Vonné svíčky"?"":"/collection.png",status:"active",sample:1,revision:1,updatedAt:""
}));
export const samples:Product[] = [...initialSamples,...additionalSamples];
export const sampleImageClasses:Record<string,string> = {"Vázy":"sample-vase","Misky":"sample-shell","Podnosy":"sample-tray","Vonné svíčky":"sample-candle","Sety":"sample-set"};
