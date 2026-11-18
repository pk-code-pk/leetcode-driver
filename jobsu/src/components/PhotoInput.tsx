"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

/**
 * Picks a photo, crops it to a square and shrinks it in the browser, then puts
 * the result in a hidden "photo" field. The server never sees the original file.
 */
export function PhotoInput({ current, required }: { current?: string | null; required?: boolean }) {
  const [preview, setPreview] = useState<string | null>(current ?? null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);

  async function pick(f: File | undefined) {
    if (!f) return;
    setError("");
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type)) return setError("Please choose a JPG or PNG photo.");
    if (f.size > 15_000_000) return setError("That photo is too large. Please choose one under 15 MB.");
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(f);
      const side = Math.min(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 320;
      canvas
        .getContext("2d")!
        .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 320, 320);
      const url = canvas.toDataURL("image/jpeg", 0.82);
      setPreview(url);
      setValue(url);
    } catch {
      setError("We couldn't read that photo. Please try a different one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => file.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-tint text-muted transition-colors hover:border-ink/30"
          aria-label={preview ? "Change photo" : "Add a photo"}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={24} strokeWidth={1.5} />
          )}
        </button>
        <div>
          <button type="button" onClick={() => file.current?.click()} className="btn btn-outline btn-sm" disabled={busy}>
            {busy ? "Processing…" : preview ? "Change photo" : "Choose a photo"}
          </button>
          <p className="hint mt-1.5">A clear photo of your face. JPG or PNG.</p>
        </div>
      </div>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => pick(e.target.files?.[0])}
        // Lets the browser block submitting without a photo when one is required.
        required={required && !preview}
      />
      <input type="hidden" name="photo" value={value} />
      {error && <p className="mt-2 text-[14px] text-red-700">{error}</p>}
    </div>
  );
}
