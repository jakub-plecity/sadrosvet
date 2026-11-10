// CZ pickup points and Z-BOXes use the carrier's 15 kg limit within the shop's 25 kg ceiling.
const packagingGrams = 1000;
const parcelLimitGrams = Math.min(25000, 15000);

export function productWeightGrams(weight) {
 const match = /^(\d{1,6}(?:[.,]\d{1,3})?)\s*(kg|g)$/i.exec(String(weight ?? "").trim());
 if (!match) return null;
 const grams = Math.round(Number(match[1].replace(",", ".")) * (match[2].toLowerCase() === "kg" ? 1000 : 1));
 return grams > 0 ? grams : null;
}

/** @param {{weight_grams:number|null, quantity:number, name:string, unit_price_minor:number}[]} items */
export function planPacketaParcels(items) {
 /** @type {{weightGrams:number,valueMinor:number,items:{line:number,name:string,quantity:number}[],barcode?:string,packetId?:string}[]} */
 const parcels = [];
 if (!items.length || items.some(item => !item.weight_grams)) return {parcels, reason:"missing-weight"};
 if (items.some(item => item.weight_grams + packagingGrams > parcelLimitGrams)) return {parcels, reason:"oversize-item"};
 const sorted = items.map((item,line) => ({...item,line})).sort((a,b) => b.weight_grams - a.weight_grams);
 for (const item of sorted) {
  for (let unit = 0; unit < item.quantity; unit++) {
   let parcel = parcels.find(parcel => parcel.weightGrams + item.weight_grams <= parcelLimitGrams);
   if (!parcel) {
    parcel = {weightGrams:packagingGrams,valueMinor:0,items:[]};
    parcels.push(parcel);
   }
   parcel.weightGrams += item.weight_grams;
   parcel.valueMinor += item.unit_price_minor;
   const packed = parcel.items.find(packed => packed.line === item.line);
   if (packed) packed.quantity++;
   else parcel.items.push({line:item.line,name:item.name,quantity:1});
  }
 }
 return {parcels, reason:null};
}
