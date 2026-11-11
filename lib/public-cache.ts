import "server-only";
import {unstable_cache,revalidateTag} from "next/cache";
import {readProducts,readCategories} from "./server";

// Only public, non-personalized data. Admin lists, checkout and stock validation bypass this cache.
export const cachePolicy={
 products:{tag:"sadrosvet:public-products",seconds:900},
 categories:{tag:"sadrosvet:public-categories",seconds:3600}
} as const;
export const cachedProducts=unstable_cache(
 ()=>readProducts(false),["sadrosvet","public-products","v1"],
 {revalidate:cachePolicy.products.seconds,tags:[cachePolicy.products.tag]}
);
export const cachedCategories=unstable_cache(
 ()=>readCategories(),["sadrosvet","public-categories","v1"],
 {revalidate:cachePolicy.categories.seconds,tags:[cachePolicy.categories.tag]}
);
export function invalidatePublicCache(scope:"products"|"categories"|"all"){
 const tags=scope==="all"?[cachePolicy.products.tag,cachePolicy.categories.tag]:[cachePolicy[scope].tag];
 // expire:0 forces a fresh read on the next request, not stale-while-revalidate.
 for(const tag of tags)revalidateTag(tag,{expire:0});
}
