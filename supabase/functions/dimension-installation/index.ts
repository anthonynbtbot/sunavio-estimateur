import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";
import { estimateIrradiance } from "../_shared/irradiance.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-pro";

const SYSTEM_PROMPT = `Tu es un ingénieur solaire senior de SUNAVIO, société marocaine d'ingénierie photovoltaïque premium. Tu dois dimensionner une pré-étude pour un particulier à partir des données collectées via notre estimateur en ligne.

Tu produis DEUX versions comparables :
- V1 "Essentielle" : installation solaire classique sans stockage batterie, auto-consommation + injection
- V2 "Premium" : même puissance PV que V1 + stockage batterie WeCo pour autonomie et résilience

RÈGLES MÉTIER SUNAVIO À APPLIQUER STRICTEMENT :

ÉQUIPEMENTS STANDARDS :
- Panneau : Jinko Tiger Neo 630W Bifacial, dimensions 2.47m × 1.13m = environ 2.79 m² par panneau
- Onduleur résidentiel : WeCo XTE (monophasé hybride 6/8/10 kW selon puissance)
- Batterie V2 : WeCo 5K3 EVO — modules HV empilables de 5.32 kWh par module, minimum 6 modules (31.92 kWh), maximum 14 modules (74.48 kWh)

PRIX SUNAVIO (fourchette marge 32% incluse) :
- V1 installation complète : 6 500 à 7 500 DH HT par kWc (panneaux, onduleur, structure, câblage, installation, monitoring, garanties)
- V2 supplément batterie : 8 000 à 11 000 DH HT par kWh de capacité batterie installée

PRODUCTION SPÉCIFIQUE : utilise la valeur production_specific_kwh_per_kwc fournie en input.

MAJORATION DE LA CONSOMMATION EFFECTIVE (à appliquer avant le calcul kWc) :
- Si has_ac = true ET ville dans zone chaude (Marrakech, Fès, Meknès, Oujda, villes du sud, intérieur) : +20% de annual_kwh
- Si has_pool = true : +1500 kWh/an fixe
- Si has_ev = true : +2500 kWh/an fixe
- Cumulables.

DIMENSIONNEMENT V1 (SANS BATTERIE) :
- recommended_kwc_v1 = effective_annual_kwh / production_specific, arrondi au 0.1 le plus proche
- Plage 0.8× à 1.2× du besoin théorique
- Nombre de panneaux = ceil(recommended_kwc_v1 × 1000 / 630)
- Budget V1 min = recommended_kwc_v1 × 6500 (arrondi entier)
- Budget V1 max = recommended_kwc_v1 × 7500 (arrondi entier)
- Production V1 = recommended_kwc_v1 × production_specific (arrondi entier)

DIMENSIONNEMENT V2 (AVEC BATTERIE) :
- recommended_kwc_v2 = recommended_kwc_v1
- Capacité cible = (effective_annual_kwh / 365) × 0.35 × 1.25
- Modules 5K3 EVO = ceil(capacité_cible / 5.32), min 6, max 14
- Capacité réelle = nb_modules × 5.32
- Budget V2 min = Budget V1 min + (capacité_réelle × 8000) (arrondi)
- Budget V2 max = Budget V1 max + (capacité_réelle × 11000) (arrondi)
- Production V2 = Production V1

LIMITATION SURFACE TOIT :
- surface_nécessaire = nb_panneaux × 2.79 × 1.3
- Si roof_surface < surface_nécessaire : limiter recommended_kwc à floor((roof_surface / (2.79 × 1.3)) × 630 / 1000 × 10) / 10
- Flaguer roof_surface_limiting: true et recalculer

VIABILITÉ :
- Viable si recommended_kwc_v1 >= 2
- Sinon is_viable=false, message bienveillant, v1 et v2 = null

RENTABILITÉ :
- Économie V1 = annual_production × 1.2 DH/kWh
- ROI V1 = budget_moyen / économie
- Économie V2 = économie V1 + 800 DH/an
- ROI V2 = budget_moyen V2 / économie V2
- Arrondir 0.1 près

FORMAT DE RÉPONSE STRICT (JSON UNIQUEMENT, SANS MARKDOWN) :

{
  "is_viable": true,
  "viability_message": null,
  "effective_annual_kwh": 2856,
  "production_specific_kwh_per_kwc": 1650,
  "roof_surface_limiting": false,
  "v1": {
    "recommended_kwc": 1.8,
    "nb_panels": 3,
    "annual_production_kwh": 2970,
    "budget_min_dh": 11700,
    "budget_max_dh": 13500,
    "roi_years": 3.5,
    "description": "Installation solaire classique sans stockage."
  },
  "v2": {
    "recommended_kwc": 1.8,
    "nb_panels": 3,
    "nb_battery_modules": 6,
    "battery_capacity_kwh": 31.92,
    "annual_production_kwh": 2970,
    "budget_min_dh": 267060,
    "budget_max_dh": 364620,
    "roi_years": 42.5,
    "description": "Installation avec batterie WeCo 5K3 EVO."
  },
  "technical_notes": ["..."]
}

Si is_viable = false : v1 et v2 = null, viability_message rempli avec un message bienveillant et personnalisé.

N'INVENTE RIEN. Applique rigoureusement les règles. Arrondis comme demandé.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseAiJson(raw: string): any | null {
  if (!raw) return null;
  let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a !== -1 && b > a) {
      try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; }
    }
    return null;
  }
}

function fallbackCalc(input: any, prodSpec: number) {
  const eff = Number(input.annual_kwh ?? 0);
  const kwc = Math.round((eff / prodSpec) * 10) / 10;
  if (kwc < 2) {
    return {
      is_viable: false,
      viability_message:
        "Votre consommation actuelle reste trop faible pour qu'une installation solaire soit pleinement rentable aujourd'hui.",
      effective_annual_kwh: eff,
      production_specific_kwh_per_kwc: prodSpec,
      roof_surface_limiting: false,
      v1: null, v2: null,
      technical_notes: ["fallback_calculation"],
    };
  }
  const nbPanels = Math.ceil((kwc * 1000) / 630);
  const prod = Math.round(kwc * prodSpec);
  const bMin = Math.round(kwc * 6500), bMax = Math.round(kwc * 7500);
  const roi = Math.round((((bMin + bMax) / 2) / (prod * 1.2)) * 10) / 10;
  const battModules = Math.max(6, Math.ceil(((eff / 365) * 0.35 * 1.25) / 5.32));
  const battCap = Math.round(battModules * 5.32 * 100) / 100;
  const v2Min = Math.round(bMin + battCap * 8000);
  const v2Max = Math.round(bMax + battCap * 11000);
  const v2Roi = Math.round((((v2Min + v2Max) / 2) / (prod * 1.2 + 800)) * 10) / 10;
  return {
    is_viable: true,
    viability_message: null,
    effective_annual_kwh: eff,
    production_specific_kwh_per_kwc: prodSpec,
    roof_surface_limiting: false,
    v1: {
      recommended_kwc: kwc, nb_panels: nbPanels, annual_production_kwh: prod,
      budget_min_dh: bMin, budget_max_dh: bMax, roi_years: roi,
      description: "Installation solaire classique sans stockage.",
    },
    v2: {
      recommended_kwc: kwc, nb_panels: nbPanels,
      nb_battery_modules: battModules, battery_capacity_kwh: battCap,
      annual_production_kwh: prod,
      budget_min_dh: v2Min, budget_max_dh: v2Max, roi_years: v2Roi,
      description: "Installation avec batterie WeCo 5K3 EVO.",
    },
    technical_notes: ["fallback_calculation"],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);
  const rl = await checkRateLimit(supabase, ip, "dimension-installation", 20);
  if (!rl.allowed) {
    return json({ success: false, error: "rate_limit", retry_after: rl.retryAfter }, 429);
  }

  try {
    const body = await req.json();
    const leadId: string | undefined = body?.leadId;
    const lat = Number(body?.lat ?? 0), lng = Number(body?.lng ?? 0);
    const zone = lat && lng ? estimateIrradiance(lat, lng) : { irradiance: 1650, name: "default" };
    const prodSpec = zone.irradiance;

    const userPayload = { ...body, production_specific_kwh_per_kwc: prodSpec, irradiance_zone: zone.name };

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let parsed: any = null;
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Dimensionne ce projet:\n${JSON.stringify(userPayload, null, 2)}` },
          ],
        }),
      });

      if (aiRes.status === 429) {
        await supabase.from("ai_call_log").insert({ function_name: "dimension-installation", success: false, error_code: "429" });
        return json({ success: false, error: "Rate limits exceeded" }, 429);
      }
      if (aiRes.status === 402) {
        return json({ success: false, error: "Payment required" }, 402);
      }
      if (aiRes.ok) {
        const data = await aiRes.json();
        const raw = data?.choices?.[0]?.message?.content ?? "";
        parsed = parseAiJson(raw);
      } else {
        console.error("AI gateway error", aiRes.status, await aiRes.text());
      }
    } catch (e) {
      console.error("AI call failed", e);
    }

    if (!parsed || typeof parsed.is_viable !== "boolean") {
      console.warn("Falling back to deterministic calc");
      parsed = fallbackCalc(body, prodSpec);
    }

    await supabase.from("ai_call_log").insert({
      function_name: "dimension-installation",
      success: true,
    });

    // Persist to lead if provided
    if (leadId) {
      const updates: Record<string, unknown> = {
        dimensioning_ai_result: parsed,
      };
      if (parsed.is_viable && parsed.v1) {
        updates.recommended_kwc = parsed.v1.recommended_kwc;
        updates.estimated_production_kwh = parsed.v1.annual_production_kwh;
        updates.estimated_budget_min = parsed.v1.budget_min_dh;
        updates.estimated_budget_max = parsed.v1.budget_max_dh;
        updates.estimated_roi_years = parsed.v1.roi_years;
      }
      if (parsed.is_viable && parsed.v2) {
        updates.v2_battery_capacity_kwh = parsed.v2.battery_capacity_kwh;
        updates.v2_battery_modules = parsed.v2.nb_battery_modules;
        updates.v2_budget_min = parsed.v2.budget_min_dh;
        updates.v2_budget_max = parsed.v2.budget_max_dh;
        updates.v2_roi_years = parsed.v2.roi_years;
      }
      await supabase.from("leads").update(updates).eq("id", leadId);
    }

    return json({ success: true, result: parsed });
  } catch (err) {
    console.error("dimension-installation error", err);
    return json({ success: false, error: err instanceof Error ? err.message : "unknown" }, 500);
  }
});
