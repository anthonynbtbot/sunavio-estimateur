import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a lead row AND its files from the `lead-uploads` bucket.
 *
 * Storage cleanup must happen before the row delete and via the Storage API
 * (Supabase forbids direct DELETE on `storage.objects` from SQL triggers).
 *
 * Storage cleanup failures are logged but never block the row deletion: a
 * lingering file is far less harmful than a lead row that cannot be removed.
 */
export async function deleteLeadWithFiles(leadId: string): Promise<{ error: unknown | null }> {
  // 1. Read the file paths attached to the lead
  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("invoice_photo_url, roof_photos_urls")
    .eq("id", leadId)
    .maybeSingle();

  if (fetchError) {
    console.warn("deleteLeadWithFiles: lookup failed, will still try to delete row", fetchError);
  }

  // 2. Best-effort storage cleanup
  if (lead) {
    const paths: string[] = [];
    if (typeof lead.invoice_photo_url === "string" && lead.invoice_photo_url.length > 0) {
      paths.push(lead.invoice_photo_url);
    }
    if (Array.isArray(lead.roof_photos_urls)) {
      for (const p of lead.roof_photos_urls) {
        if (typeof p === "string" && p.length > 0) paths.push(p);
      }
    }
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("lead-uploads")
        .remove(paths);
      if (storageError) {
        console.warn("deleteLeadWithFiles: storage cleanup failed", storageError);
      }
    }
  }

  // 3. Delete the row
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  return { error };
}