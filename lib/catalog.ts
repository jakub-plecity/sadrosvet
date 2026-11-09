export type Product = {id:string; name:string; description:string; detailedDescription?:string; dimensions?:string; weight?:string; category:string; priceMinor:number; stock:number; image:string; images?:string[]; status:"active"|"draft"|"archived"; sample:number; revision:number; sortOrder?:number; updatedAt:string};
export type DemoOrder = {id:string; items:string; totalMinor:number; shipping:string; createdAt:string};
export const catalogCategories = ["Vázy", "Misky", "Podnosy", "Vonné svíčky", "Sety"];
export const money = (minor:number) => new Intl.NumberFormat("cs-CZ", {style:"currency",currency:"CZK", minimumFractionDigits:0, maximumFractionDigits:2}).format(minor/100);
// No demo products are seeded into the live catalog. Historical IDs are
// handled by the explicitly opt-in Supabase cleanup script.
export const additionalSamples:Product[] = [];
export const samples:Product[] = [];
export const sampleImageClasses:Record<string,string> = {"Vázy":"sample-vase","Misky":"sample-shell","Podnosy":"sample-tray","Vonné svíčky":"sample-candle","Sety":"sample-set"};
