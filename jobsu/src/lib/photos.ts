import { eq } from "drizzle-orm";
import { db } from "@/db";
import { photos, users } from "@/db/schema";

const MAX_BYTES = 400_000;

/**
 * Save a photo from a PhotoInput field. Returns an error message, or null when
 * the photo was saved or no new photo was given.
 */
export async function savePhotoFromForm(userId: string, data: FormData): Promise<string | null> {
  const dataUrl = String(data.get("photo") ?? "");
  if (!dataUrl) return null;
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(dataUrl) || dataUrl.length > MAX_BYTES) {
    return "That photo couldn't be used. Please choose another one.";
  }
  const now = new Date();
  await db
    .insert(photos)
    .values({ userId, dataUrl, updatedAt: now })
    .onConflictDoUpdate({ target: photos.userId, set: { dataUrl, updatedAt: now } });
  await db.update(users).set({ photoAt: now }).where(eq(users.id, userId));
  return null;
}
