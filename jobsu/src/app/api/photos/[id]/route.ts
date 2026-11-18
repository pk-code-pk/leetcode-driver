import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { currentUser } from "@/lib/auth";

// Profile photos are only shown to signed-in people.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new Response("Not found", { status: 404 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const [photo] = await db.select().from(photos).where(eq(photos.userId, id)).limit(1);
  const match = photo?.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: { "Content-Type": match[1], "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
