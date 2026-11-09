import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("catalog does not render the contact form",()=>{
 const page=source("app/page.tsx");
 assert.doesNotMatch(page,/<ContactForm\s*\/?\s*>/);
 assert.doesNotMatch(page,/import\s*\{\s*ContactForm\s*\}/);
});

test("business contact remains in footer",()=>{
 const footer=source("components/site-footer.tsx");
 assert.match(footer,/sadrosvet@seznam\.cz/);
 assert.match(footer,/\+420 775 014 878/);
 assert.match(footer,/Petr Valenta/);
 assert.match(footer,/href="\/admin"/);
});

test("catalog hides photo navigation but product detail enables it",()=>{
 const gallery=source("components/product-gallery.tsx");
 const page=source("app/page.tsx");
 assert.match(gallery,/showControls=false/);
 assert.match(gallery,/showControls&&images\.length>1/);
 assert.match(page,/<ProductGallery key=\{detail\.id\}[^>]*showControls/);
});

test("shipping announcement and threshold remain present",()=>{
 const header=source("components/site-header.tsx");
 const shipping=source("lib/checkout.ts");
 assert.match(header,/Doprava zdarma při nákupu od 1 500 Kč/);
 assert.match(shipping,/FREE_SHIPPING_THRESHOLD_MINOR=150000/);
});

test("product reorder is locked while filtered",()=>{
 const admin=source("app/admin/portal.tsx");
 assert.match(admin,/orderingLocked=search\.trim\(\)\.length>0\|\|filter!=="all"/);
 assert.match(admin,/draggable=\{!busy&&!orderingLocked\}/);
});

test("the 20 historical sample products cannot be seeded again",()=>{
 const catalog=source("lib/catalog.ts");
 assert.match(catalog,/export const samples:Product\[\] = \[\];/);
 assert.match(catalog,/export const additionalSamples:Product\[\] = \[\];/);
 assert.doesNotMatch(catalog,/id:"sample-vase"/);
 const cleanup=source("scripts/remove-approved-demo-products.mjs");
 assert.match(cleanup,/ALLOW_DEMO_PRODUCT_DELETION/);
 assert.match(cleanup,/approved\.size !== 20/);
 assert.match(cleanup,/customer_order_items/);
});


test("social links have Instagram and Facebook without TikTok",()=>{
 const socials=source("components/social-links.tsx");
 assert.match(socials,/instagram\.com\/sadrosvet/);
 assert.match(socials,/facebook\.com/);
 assert.doesNotMatch(socials,/tiktok\.com|TikTok/);
});


test("categories can be safely removed from admin without deleting products",()=>{
 const api=source("app/api/categories/route.ts");
 const admin=source("app/admin/portal.tsx");
 const server=source("lib/server.ts");
 assert.match(api,/export async function DELETE\(request:Request\)/);
 assert.match(api,/SELECT id FROM products/);
 assert.match(api,/category-hidden:/);
 assert.match(server,/category-hidden:/);
 assert.match(admin,/Spravovat kategorie/);
 assert.match(admin,/categoryToDelete/);
 assert.match(admin,/deleteCategory\(\)/);
});

test("deleting an order-referenced product offers archive without cascading",()=>{
 const endpoint=source("app/api/products/[id]/route.ts");
 const admin=source("app/admin/portal.tsx");
 assert.match(endpoint,/customer_order_items WHERE product_id/);
 assert.match(endpoint,/canArchive:true/);
 assert.match(endpoint,/23503/);
 assert.doesNotMatch(endpoint,/ON DELETE CASCADE/);
 assert.match(admin,/data\\.canArchive===true/);
 assert.match(admin,/setRemove\\(product\\)/);
});
