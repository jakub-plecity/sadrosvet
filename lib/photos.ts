import type {Database} from "./database";
import type {ImageBucket} from "./storage";
export type Photo = {
  id: string;
  image: string;
  name: string;
  contentType: string | null;
  createdAt: string;
  productCount: number;
};

export function preparePhotoImport(db: Database, now: string) {
  return db.prepare(`INSERT INTO photos (id,image,name,content_type,created_at)
    SELECT 'existing:' || image, image,
      CASE WHEN image='/collection.png' THEN 'Ukázková kolekce dekorací' ELSE MIN(name) END,
      CASE WHEN image='/collection.png' THEN 'image/png' ELSE NULL END,
      COALESCE(MIN(NULLIF(updated_at,'')),$1)
    FROM products WHERE image <> '' GROUP BY image ON CONFLICT DO NOTHING`).bind(now);
}

export async function readPhotos(db: Database): Promise<Photo[]> {
  const { results } = await db.prepare(`SELECT photos.id,photos.image,photos.name,
    photos.content_type,photos.created_at,COUNT(products.id) AS product_count
    FROM photos LEFT JOIN products ON products.image=photos.image
    GROUP BY photos.id ORDER BY photos.created_at DESC,photos.id`).all();
  return results.map(row => ({
    id: String(row.id),
    image: String(row.image),
    name: String(row.name),
    contentType: row.content_type == null ? null : String(row.content_type),
    createdAt: String(row.created_at),
    productCount: Number(row.product_count)
  }));
}

export async function storeUploadedPhoto(
  db: Database,
  bucket: ImageBucket,
  input: { id: string; bytes: Uint8Array; contentType: string; name: string }
) {
  const image = "/api/images/" + input.id;
  await bucket.put(input.id, input.bytes, { httpMetadata: { contentType: input.contentType } });
  try {
    await db.prepare(`INSERT INTO photos (id,image,name,content_type,created_at)
      VALUES ($1,$2,$3,$4,$5)`).bind(
      input.id, image, input.name.trim().slice(0, 120) || "Fotografie produktu",
      input.contentType, new Date().toISOString()
    ).run();
  } catch (error) {
    try { await bucket.delete(input.id); }
    catch (cleanupError) { console.error("SádroSvět: úklid neuložené fotografie", cleanupError); }
    throw error;
  }
  return image;
}
