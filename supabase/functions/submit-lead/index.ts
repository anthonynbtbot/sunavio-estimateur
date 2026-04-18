// Thin wrapper around the submit_lead RPC that injects a hashed client IP
// for per-IP rate limiting (5 leads/h/IP). All validation still happens in
// the SECURITY DEFINER Postgres function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { hashIp, getClientIp } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return json({ success: false, error: "invalid_payload" }, 400);
    }

    const ip = getClientIp(req);
    const ipHash = ip === "unknown" ? null : await hashIp(ip);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("submit_lead", {
      payload,
      _ip_hash: ipHash,
    });

    if (error) {
      console.error("submit_lead RPC error", error);
      return json({ success: false, error: "internal_error" }, 500);
    }

    return json(data ?? { success: false, error: "internal_error" });
  } catch (err) {
    console.error("submit-lead error", err);
    return json({ success: false, error: "internal_error" }, 500);
  }
});
