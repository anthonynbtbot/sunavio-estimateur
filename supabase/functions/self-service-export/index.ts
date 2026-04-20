// Self-service GDPR portability endpoint.
// Public (no JWT): authenticated by the per-lead self_service_token only.
// Returns a structured JSON of all data linked to the lead, as a download.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonError(error: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error }), {
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
      return jsonError("method_not_allowed", 405);
    }

    if (!token || !UUID_RE.test(token)) {
      return jsonError("invalid_token", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("self_service_token", token)
      .maybeSingle();

    if (error) {
      console.error("self-service-export lookup error", error);
      return jsonError("internal_error", 500);
    }
    if (!lead) {
      return jsonError("not_found", 404);
    }

    // Strip the token itself from the export to avoid leaking it again
    const { self_service_token: _t, ...safeLead } = lead as Record<string, unknown>;

    const payload = {
      export_generated_at: new Date().toISOString(),
      data_controller: {
        name: "SUNAVIO SARL",
        contact: "sunavio.contact@gmail.com",
      },
      lead: safeLead,
      notice:
        "Conformément au RGPD (art. 20) et à la loi marocaine 09-08, ce fichier contient l'intégralité des données personnelles que SUNAVIO détient à votre sujet à la date d'export. Pour exercer votre droit à l'effacement, utilisez le lien fourni dans votre email de confirmation.",
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mes-donnees-sunavio.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("self-service-export error", err);
    return jsonError("internal_error", 500);
  }
});