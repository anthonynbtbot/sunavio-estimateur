import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { downloadFromBucket } from "../_shared/storage.ts";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";
import { guardLeadMutation, isServiceRoleCall } from "../_shared/lead-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = Number(Deno.env.get("DAILY_AI_LIMIT") ?? "500");
const MODEL = "google/gemini-2.5-pro";
const MAX_FILES = 3;
const BUCKET = "lead-uploads";

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction d'informations des factures d'électricité de l'Office National de l'Électricité et de l'Eau Potable (ONEE) du Maroc.

On va te fournir UNE OU PLUSIEURS factures ONEE (entre 1 et 3 fichiers, photos ou PDF). Chaque fichier correspond à un mois de facturation différent. Ton objectif est d'extraire les informations consolidées suivantes :

- Les consommations en kWh des 3 derniers mois (ou autant que possible si moins de 3 factures fournies). Trie-les chronologiquement (le plus ancien en premier, le plus récent en dernier).
- La consommation annuelle totale si elle est visible sur l'une des factures
- Le type de contrat (Résidentiel BT, Tarif social, Professionnel BT, Moyenne tension, ou Autre) — il devrait être identique sur toutes les factures
- La puissance souscrite en kVA — identique sur toutes les factures
- Le nom du titulaire du contrat (si visible)
- La ville du compteur (si visible)

IMPORTANT : si tu reçois plusieurs factures, fusionne intelligemment les informations. Pour les consommations mensuelles, prends UNE valeur de consommation par facture (la consommation du mois facturé, pas un index cumulé).

Réponds UNIQUEMENT avec un objet JSON strict, sans Markdown, sans backticks, sans commentaire. Format exact attendu :

{
  "success": true,
  "confidence": "high" | "medium" | "low",
  "monthly_kwh": [180, 220, 195],
  "annual_kwh": 2380,
  "contract_type": "Résidentiel BT",
  "subscribed_power_kva": 9,
  "holder_name": "NEBOUT Anthony",
  "city": "Marrakech",
  "notes": "3 factures analysées, valeurs cohérentes"
}

Si tu ne peux pas lire les images correctement (floues, mal cadrées, pas des factures ONEE, documents illisibles) :

{
  "success": false,
  "confidence": "low",
  "reason": "Images floues, impossible de distinguer les chiffres de consommation",
  "suggestion": "Prendre des photos plus nettes, avec un bon éclairage, sans reflet sur le papier"
}

Règles importantes :
- Si tu n'es pas sûr d'une valeur, mets-la mais baisse la confidence à "medium" ou "low"
- Si un champ n'est pas visible, mets null (sauf monthly_kwh qui peut contenir moins de 3 valeurs)
- Ne JAMAIS inventer des valeurs. Mieux vaut null que faux.
- Si plusieurs factures donnent des valeurs contradictoires pour contract_type ou subscribed_power_kva, prends celle de la facture la plus récente et baisse la confidence à "medium".
- La confidence "high" est réservée aux cas où tu es absolument certain de toutes les valeurs extraites.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseAiJson(raw: string): any | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Rate limit per IP (skip if service-role caller)
  const isServiceCall = isServiceRoleCall(req);
  if (!isServiceCall) {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(supabase, ip, "analyze-invoice");
    if (!rl.allowed) {
      return json(
        { success: false, error: "rate_limit", retry_after: rl.retryAfter, fallback: true },
        429,
      );
    }
  }

  try {
    const body = await req.json();
    const leadId: string | undefined = typeof body?.leadId === "string" ? body.leadId : undefined;

    // Accept new format `imagePaths` (relative paths) — and legacy `imageUrls` / `imageUrl`.
    let inputs: string[] = [];
    if (Array.isArray(body?.imagePaths)) {
      inputs = body.imagePaths.filter((u: unknown) => typeof u === "string");
    } else if (Array.isArray(body?.imageUrls)) {
      inputs = body.imageUrls.filter((u: unknown) => typeof u === "string");
    } else if (typeof body?.imageUrl === "string") {
      inputs = [body.imageUrl];
    }
    if (inputs.length === 0) {
      return json({ success: false, error: "imagePaths is required" }, 400);
    }
    if (inputs.length > MAX_FILES) inputs = inputs.slice(0, MAX_FILES);

    // Path guard: must live under invoices/ prefix and not contain traversal
    const safePaths = inputs.every((p) => {
      const clean = p.replace(/^\/+/, "");
      return clean.startsWith("invoices/") && !clean.includes("..") && clean.length < 300;
    });
    if (!safePaths) {
      return json({ success: false, error: "forbidden", reason: "invalid_path" }, 403);
    }

    // Lead-bound guard for non-service callers
    if (!isServiceCall) {
      if (leadId) {
        const guard = await guardLeadMutation(supabase, req, leadId);
        if (!guard.allowed) {
          return json({ success: false, error: "forbidden", reason: guard.reason }, 403);
        }
        const { data: lead } = await supabase
          .from("leads")
          .select("invoice_photo_url")
          .eq("id", leadId)
          .maybeSingle();
        const linked = lead?.invoice_photo_url ?? null;
        if (linked && !inputs.includes(linked)) {
          return json({ success: false, error: "forbidden", reason: "path_mismatch" }, 403);
        }
      } else {
        // No leadId: only allow paths whose object was uploaded < 10 min ago
        const cutoff = Date.now() - 10 * 60 * 1000;
        for (const p of inputs) {
          const clean = p.replace(/^\/+/, "");
          const slash = clean.lastIndexOf("/");
          const dir = slash > 0 ? clean.slice(0, slash) : "";
          const name = slash > 0 ? clean.slice(slash + 1) : clean;
          const { data: list } = await supabase.storage.from(BUCKET).list(dir, {
            search: name,
            limit: 5,
          });
          const found = list?.find((o: { name: string; created_at?: string }) => o.name === name);
          if (!found?.created_at) {
            return json({ success: false, error: "forbidden", reason: "unknown_path" }, 403);
          }
          if (new Date(found.created_at).getTime() < cutoff) {
            return json({ success: false, error: "forbidden", reason: "stale_path" }, 403);
          }
        }
      }
    }

    // Daily cap
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("ai_call_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    if ((count ?? 0) >= DAILY_LIMIT) {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-invoice",
        success: false,
        error_code: "daily_limit_reached",
      });
      return json(
        {
          success: false,
          confidence: "low",
          reason: "Plafond journalier d'analyses IA atteint.",
          suggestion: "Merci de saisir vos consommations manuellement.",
          fallback: true,
        },
        200,
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    // Download via service role from private bucket
    const fetched: { dataUrl: string; mimeType: string }[] = [];
    for (const p of inputs) {
      const f = await downloadFromBucket(supabase, BUCKET, p);
      if (f) fetched.push(f);
    }

    if (fetched.length === 0) {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-invoice",
        success: false,
        error_code: "fetch_failed",
      });
      return json(
        {
          success: false,
          confidence: "low",
          reason: "Impossible de récupérer les fichiers.",
          fallback: true,
        },
        200,
      );
    }

    const hasPdf = fetched.some((f) => f.mimeType === "application/pdf");
    const userPrompt =
      fetched.length === 1
        ? hasPdf
          ? "Analyse ce PDF de facture ONEE et extrais les informations demandées."
          : "Analyse cette facture ONEE et extrais les informations demandées."
        : `Analyse ces ${fetched.length} factures ONEE (chacune correspond à un mois différent) et fournis les informations consolidées.`;

    const userContent: any[] = [{ type: "text", text: userPrompt }];
    for (const f of fetched) {
      userContent.push({ type: "image_url", image_url: { url: f.dataUrl } });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-invoice",
        success: false,
        error_code: String(aiRes.status),
      });
      if (aiRes.status === 429) {
        return json({ success: false, confidence: "low", reason: "Trop de requêtes, réessayez dans un instant.", fallback: true }, 200);
      }
      if (aiRes.status === 402) {
        return json({ success: false, confidence: "low", reason: "Crédits IA épuisés.", fallback: true }, 200);
      }
      return json({ success: false, confidence: "low", reason: "Service d'analyse indisponible.", fallback: true }, 200);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseAiJson(raw);

    if (!parsed || typeof parsed !== "object") {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-invoice",
        success: false,
        error_code: "parse_error",
      });
      return json({ success: false, confidence: "low", reason: "Réponse IA non exploitable.", fallback: true }, 200);
    }

    await supabase.from("ai_call_log").insert({
      function_name: "analyze-invoice",
      success: true,
    });

    return json(parsed, 200);
  } catch (err) {
    console.error("analyze-invoice error", err);
    return json(
      {
        success: false,
        confidence: "low",
        reason: "internal_error",
        fallback: true,
      },
      200,
    );
  }
});
