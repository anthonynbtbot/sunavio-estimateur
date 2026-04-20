// Self-service GDPR delete endpoint.
// Public (no JWT): authenticated by the per-lead self_service_token only.
// Deleting the lead row triggers the storage cleanup (cascade trigger).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let token: string | null = null;
    if (req.method === "GET") {
      token = new URL(req.url).searchParams.get("token");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = typeof body?.token === "string" ? body.token : null;
    } else {
      return json({ success: false, error: "method_not_allowed" }, 405);
    }

    if (!token || !UUID_RE.test(token)) {
      return json({ success: false, error: "invalid_token" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead, error: lookupError } = await supabase
      .from("leads")
      .select("id, invoice_photo_url, roof_photos_urls")
      .eq("self_service_token", token)
      .maybeSingle();

    if (lookupError) {
      console.error("self-service-delete lookup error", lookupError);
      return json({ success: false, error: "internal_error" }, 500);
    }
    if (!lead) {
      return json({ success: false, error: "not_found" }, 404);
    }

    // Step 1: clean up storage files via the Storage API (DB triggers cannot
    // delete from storage.objects directly).
    const filePaths: string[] = [];
    if (typeof lead.invoice_photo_url === "string" && lead.invoice_photo_url.length > 0) {
      filePaths.push(lead.invoice_photo_url);
    }
    if (Array.isArray(lead.roof_photos_urls)) {
      for (const p of lead.roof_photos_urls) {
        if (typeof p === "string" && p.length > 0) filePaths.push(p);
      }
    }
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("lead-uploads")
        .remove(filePaths);
      if (storageError) {
        // Log but do not block the deletion of the lead row itself.
        console.error("self-service-delete storage cleanup error", storageError);
      }
    }

    // Step 2: delete the lead row
    const { error: deleteError } = await supabase
      .from("leads")
      .delete()
      .eq("id", lead.id);

    if (deleteError) {
      console.error("self-service-delete delete error", deleteError);
      return json({ success: false, error: "internal_error" }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error("self-service-delete error", err);
    return json({ success: false, error: "internal_error" }, 500);
  }
});