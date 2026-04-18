// Shared helper: download a file from a private Supabase Storage bucket
// using the service role client and return base64 + MIME type.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface FetchedFile {
  dataUrl: string;
  mimeType: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[],
    );
  }
  return btoa(bin);
}

/**
 * Accepts either:
 *   - a relative path inside the bucket (e.g. "invoices/abc.pdf")
 *   - a full Supabase storage URL (legacy support)
 * Returns null on failure.
 */
export async function downloadFromBucket(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  pathOrUrl: string,
): Promise<FetchedFile | null> {
  let path = pathOrUrl;
  // Extract path if a full URL was passed (legacy)
  const marker = `/storage/v1/object/`;
  const idx = pathOrUrl.indexOf(marker);
  if (idx !== -1) {
    const rest = pathOrUrl.slice(idx + marker.length);
    // formats: "public/<bucket>/<path>" or "sign/<bucket>/<path>?token=..."
    const parts = rest.split("/");
    if (parts.length >= 3 && (parts[0] === "public" || parts[0] === "sign" || parts[0] === "authenticated")) {
      const bucketInUrl = parts[1];
      if (bucketInUrl === bucket) {
        path = parts.slice(2).join("/").split("?")[0];
      }
    }
  }

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    console.warn("downloadFromBucket failed", path, error?.message);
    return null;
  }
  const mimeType = data.type || "image/jpeg";
  const buf = new Uint8Array(await data.arrayBuffer());
  return { dataUrl: `data:${mimeType};base64,${bytesToBase64(buf)}`, mimeType };
}
