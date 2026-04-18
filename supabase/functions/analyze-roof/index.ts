import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { downloadFromBucket } from "../_shared/storage.ts";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = Number(Deno.env.get("DAILY_AI_LIMIT") ?? "500");
const MODEL = "google/gemini-2.5-pro";
const MAX_PHOTOS = 5;
const BUCKET = "lead-uploads";

const SYSTEM_PROMPT = `Tu es un expert en installations photovoltaïques résidentielles au Maroc, spécialisé dans l'analyse de photos de toitures pour évaluer leur potentiel solaire.

On va te fournir entre 1 et 5 photos d'une même toiture (vues différentes : ensemble, détails, angles). Analyse-les conjointement pour produire une évaluation technique complète.

Tu dois extraire :

1. TYPE ET ÉTAT DE TOITURE
   - Type principal : "terrasse" (toit plat), "tuile", "tole", "mixte", "autre"
   - Matériau visible : description courte (ex. "tuiles en terre cuite", "tôle galvanisée", "béton lissé")
   - État général : "excellent", "bon", "moyen", "mauvais"
   - Notes sur l'état si pertinent (fissures, mousse, dégradations visibles)

2. SURFACE, ORIENTATION ET PENTE
   - Surface utile estimée en m² (zone réellement exploitable pour des panneaux)
   - Orientation cardinale dominante : "S", "SE", "SO", "E", "O", "NE", "NO", "N", "plat" (si terrasse)
   - Pente approximative en degrés (0 pour terrasse, 15-45 typique pour pente)
   - Confiance de l'estimation surface : "high", "medium", "low"

3. OBSTACLES DÉTECTÉS
   - Liste des obstacles visibles qui réduisent la surface installable
   - Pour chacun : type ("cheminee", "climatiseur", "antenne", "velux", "edicule", "autre") et un libellé court
   - Impact estimé sur la surface utile en pourcentage (0-100)

4. RISQUES D'OMBRAGE
   - Sources d'ombre détectées : "arbres", "batiment_voisin", "relief", "edicule_propre", "aucun"
   - Niveau de risque global : "faible", "moyen", "eleve"
   - Notes complémentaires

5. RECOMMANDATION GLOBALE
   - Verdict installation solaire : "tres_favorable", "favorable", "acceptable", "deconseille"
   - Justification courte (1-2 phrases)
   - Surface installable nette estimée en m² (après obstacles et ombrage)

Réponds UNIQUEMENT avec un objet JSON strict, sans Markdown, sans backticks, sans commentaire :

{
  "success": true,
  "confidence": "high" | "medium" | "low",
  "roof": {
    "type": "terrasse",
    "material": "béton lissé propre",
    "condition": "bon",
    "condition_notes": "Quelques traces d'humidité sans gravité"
  },
  "geometry": {
    "usable_surface_m2": 120,
    "orientation": "plat",
    "tilt_degrees": 0,
    "surface_confidence": "medium"
  },
  "obstacles": [
    { "type": "climatiseur", "label": "2 unités extérieures côté nord", "impact_pct": 8 },
    { "type": "edicule", "label": "Cage d'escalier centrale", "impact_pct": 15 }
  ],
  "shading": {
    "sources": ["batiment_voisin"],
    "risk": "faible",
    "notes": "Bâtiment voisin de hauteur similaire à l'est, ombrage matinal léger"
  },
  "recommendation": {
    "verdict": "tres_favorable",
    "rationale": "Toiture terrasse spacieuse, bien orientée, peu d'obstacles, pas d'ombrage significatif.",
    "net_installable_m2": 95
  },
  "notes": "Analyse basée sur 4 photos cohérentes"
}

Si les photos sont inexploitables (floues, mauvaise vue, pas une toiture, etc.) :

{
  "success": false,
  "confidence": "low",
  "reason": "Photos floues ou ne montrent pas la toiture clairement",
  "suggestion": "Reprendre des photos avec un angle dégagé de la toiture entière + 1 photo détail"
}

Règles strictes :
- Ne JAMAIS inventer des valeurs précises. Mieux vaut une fourchette ou null que faux.
- La confidence "high" est rare : réservée aux cas où plusieurs angles claires confirment toutes les mesures.
- Si une seule photo très partielle, confidence "low" max.
- Sois prudent sur les surfaces : préfère sous-estimer que sur-estimer.`;

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

  // Rate limit (skip if called via service role from pg_net trigger)
  const authHeader = req.headers.get("Authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const isServiceCall = serviceKey.length > 0 && authHeader === `Bearer ${serviceKey}`;

  if (!isServiceCall) {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(supabase, ip, "analyze-roof");
    if (!rl.allowed) {
      return json(
        { success: false, error: "rate_limit", retry_after: rl.retryAfter },
        429,
      );
    }
  }

  try {
    const body = await req.json();
    const leadId: string | undefined = body?.leadId;

    // Accept new `photoPaths` (relative paths) and legacy `photoUrls`
    let inputs: string[] = [];
    if (Array.isArray(body?.photoPaths)) {
      inputs = body.photoPaths.filter((u: unknown) => typeof u === "string");
    } else if (Array.isArray(body?.photoUrls)) {
      inputs = body.photoUrls.filter((u: unknown) => typeof u === "string");
    }

    if (!leadId || inputs.length === 0) {
      return json({ success: false, error: "leadId and photoPaths required" }, 400);
    }
    if (inputs.length > MAX_PHOTOS) inputs = inputs.slice(0, MAX_PHOTOS);

    // Daily cap
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("ai_call_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    if ((count ?? 0) >= DAILY_LIMIT) {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-roof",
        success: false,
        error_code: "daily_limit_reached",
      });
      return json({ success: false, reason: "daily_limit_reached" }, 200);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const fetched: { dataUrl: string; mimeType: string }[] = [];
    for (const p of inputs) {
      const f = await downloadFromBucket(supabase, BUCKET, p);
      if (f) fetched.push(f);
    }

    if (fetched.length === 0) {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-roof",
        success: false,
        error_code: "fetch_failed",
      });
      return json({ success: false, reason: "fetch_failed" }, 200);
    }

    const userPrompt =
      fetched.length === 1
        ? "Analyse cette photo de toiture et fournis l'évaluation demandée."
        : `Analyse conjointement ces ${fetched.length} photos d'une même toiture (vues différentes) et fournis l'évaluation demandée.`;

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
        function_name: "analyze-roof",
        success: false,
        error_code: String(aiRes.status),
      });
      return json({ success: false, reason: "ai_gateway_error", status: aiRes.status }, 200);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseAiJson(raw);

    if (!parsed || typeof parsed !== "object") {
      await supabase.from("ai_call_log").insert({
        function_name: "analyze-roof",
        success: false,
        error_code: "parse_error",
      });
      await supabase
        .from("leads")
        .update({
          roof_ai_analysis: { success: false, reason: "parse_error", raw_excerpt: raw.slice(0, 500) },
          roof_ai_confidence: "low",
        })
        .eq("id", leadId);
      return json({ success: false, reason: "parse_error" }, 200);
    }

    await supabase.from("ai_call_log").insert({
      function_name: "analyze-roof",
      success: true,
    });

    const confidence = typeof parsed.confidence === "string" ? parsed.confidence : "medium";

    // ----- Cap recommended_kwc by AI-detected usable roof surface -----
    const M2_PER_KWC = 6;
    const netM2 = Number(parsed?.recommendation?.net_installable_m2);
    const usableM2 = Number(parsed?.geometry?.usable_surface_m2);
    const surfaceM2 = Number.isFinite(netM2) && netM2 > 0
      ? netM2
      : Number.isFinite(usableM2) && usableM2 > 0
        ? usableM2
        : null;

    const updatePayload: Record<string, unknown> = {
      roof_ai_analysis: parsed,
      roof_ai_confidence: confidence,
    };

    if (surfaceM2 !== null) {
      const { data: lead } = await supabase
        .from("leads")
        .select("recommended_kwc, city")
        .eq("id", leadId)
        .maybeSingle();

      const currentKwc = Number(lead?.recommended_kwc ?? 0);
      const maxKwcBySurface = Math.floor((surfaceM2 / M2_PER_KWC) * 10) / 10;

      if (currentKwc > 0 && maxKwcBySurface > 0 && maxKwcBySurface < currentKwc) {
        const city = (lead?.city ?? "").toString();
        const irradiance = city === "Essaouira" ? 1750 : city === "Agadir" ? 1700 : 1650;
        const newKwc = maxKwcBySurface;
        const newProduction = Math.round(newKwc * irradiance);
        const newBudgetMin = Math.round(newKwc * 6500);
        const newBudgetMax = Math.round(newKwc * 7500);
        const newRoi = newProduction > 0
          ? Math.round((newBudgetMin / (newProduction * 1.2)) * 10) / 10
          : null;

        updatePayload.recommended_kwc = newKwc;
        updatePayload.estimated_production_kwh = newProduction;
        updatePayload.estimated_budget_min = newBudgetMin;
        updatePayload.estimated_budget_max = newBudgetMax;
        updatePayload.estimated_roi_years = newRoi;

        (parsed as any).sizing_adjustment = {
          applied: true,
          reason: "surface_cap",
          previous_kwc: currentKwc,
          capped_kwc: newKwc,
          surface_m2_used: surfaceM2,
          m2_per_kwc: M2_PER_KWC,
        };
        updatePayload.roof_ai_analysis = parsed;
      } else {
        (parsed as any).sizing_adjustment = {
          applied: false,
          reason: currentKwc <= 0 ? "no_initial_kwc" : "surface_sufficient",
          initial_kwc: currentKwc,
          surface_m2_available: surfaceM2,
          m2_per_kwc: M2_PER_KWC,
        };
        updatePayload.roof_ai_analysis = parsed;
      }
    }

    await supabase.from("leads").update(updatePayload).eq("id", leadId);

    return json({ success: true, confidence }, 200);
  } catch (err) {
    console.error("analyze-roof error", err);
    return json(
      {
        success: false,
        reason: err instanceof Error ? err.message : "unknown",
      },
      200,
    );
  }
});
