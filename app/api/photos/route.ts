import { database, guard, failure } from "@/lib/server";
import { readPhotos } from "@/lib/photos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const denied = await guard();
    if (denied) return denied;
    return Response.json({ photos: await readPhotos(database()) }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return failure(error);
  }
}
