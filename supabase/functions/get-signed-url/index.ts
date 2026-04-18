import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUCKET = "lead-uploads";
const EXPIRES_IN = 60 * 60; // 1 hour

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  // Per-request client to verify caller identity
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return json({ error: "unauthorized" }, 401);
  }

  const userId = claims.claims.sub as string;

  // Service-role client to bypass RLS for has_role check + signed URL creation
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (roleErr || !isAdmin) {
    return json({ error: "forbidden" }, 403);
  }

  let body: { paths?: string[]; path?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === "string" && p.length > 0)
    : body.path
      ? [body.path]
      : [];

  if (paths.length === 0) return json({ error: "no_paths" }, 400);
  if (paths.length > 20) return json({ error: "too_many_paths" }, 400);

  // Sanity check: no leading slash, no protocol
  const clean = paths.map((p) => {
    let s = p.trim();
    // legacy: extract path from full URL if needed
    const marker = "/storage/v1/object/";
    const idx = s.indexOf(marker);
    if (idx !== -1) {
      const rest = s.slice(idx + marker.length);
      const parts = rest.split("/");
      if (parts.length >= 3 && parts[1] === BUCKET) {
        s = parts.slice(2).join("/").split("?")[0];
      }
    }
    return s.replace(/^\/+/, "");
  });

  const results: { path: string; signedUrl: string | null; error?: string }[] = [];
  for (const p of clean) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(p, EXPIRES_IN);
    if (error) {
      results.push({ path: p, signedUrl: null, error: error.message });
    } else {
      results.push({ path: p, signedUrl: data.signedUrl });
    }
  }

  const expiresAt = new Date(Date.now() + EXPIRES_IN * 1000).toISOString();
  return json({ urls: results, expiresAt });
});
