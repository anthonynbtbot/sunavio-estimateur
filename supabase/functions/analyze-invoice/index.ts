import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = Number(Deno.env.get("DAILY_AI_LIMIT") ?? "500");
const MODEL = "google/gemini-2.5-pro";

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'extraction d'informations des factures d'électricité de l'Office National de l'Électricité et de l'Eau Potable (ONEE) du Maroc.

On va te fournir la photo d'une facture ONEE. Tu dois extraire les informations suivantes :
- Les consommations en kWh des 3 derniers mois (ou moins si la facture n'en contient pas assez)
- La consommation annuelle totale si elle est visible
- Le type de contrat (Résidentiel BT, Tarif social, Professionnel BT, Moyenne tension, ou Autre)
- La puissance souscrite en kVA
- Le nom du titulaire du contrat (si visible)
- La ville du compteur (si visible)

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
  "notes": "Facture lisible, 3 derniers mois extraits avec certitude"
}

Si tu ne peux pas lire l'image correctement (floue, mal cadrée, pas une facture ONEE, document illisible) :

{
  "success": false,
  "confidence": "low",
  "reason": "Image floue, impossible de distinguer les chiffres de consommation",
  "suggestion": "Prendre une photo plus nette, avec un bon éclairage, sans reflet sur le papier"
}

Règles importantes :
- Si tu n'es pas sûr d'une valeur, mets-la mais baisse la confidence à "medium" ou "low"
- Si un champ n'est pas visible, mets null (sauf monthly_kwh qui peut être un tableau vide)
- Ne JAMAIS inventer des valeurs. Mieux vaut null que faux.
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
  // Strip markdown fences if any
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(s);
  } catch {
    // Try to find first { ... last }
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

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return json({ success: false, error: "imageUrl is required" }, 400);
    }

    // Daily cap check
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
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch the file to determine MIME and re-encode as data URL (works for images & PDFs)
    let dataUrl = imageUrl;
    let mimeType = "image/jpeg";
    try {
      const fileRes = await fetch(imageUrl);
      if (fileRes.ok) {
        mimeType = fileRes.headers.get("content-type") ?? mimeType;
        const buf = new Uint8Array(await fileRes.arrayBuffer());
        // base64 encode
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const b64 = btoa(bin);
        dataUrl = `data:${mimeType};base64,${b64}`;
      }
    } catch (e) {
      console.warn("Could not pre-fetch file, falling back to URL", e);
    }

    const userPrompt =
      mimeType === "application/pdf"
        ? "Analyse ce PDF de facture ONEE et extrais les informations demandées."
        : "Analyse cette facture ONEE et extrais les informations demandées.";

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
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
        return json(
          {
            success: false,
            confidence: "low",
            reason: "Trop de requêtes, réessayez dans un instant.",
            fallback: true,
          },
          200,
        );
      }
      if (aiRes.status === 402) {
        return json(
          {
            success: false,
            confidence: "low",
            reason: "Crédits IA épuisés.",
            fallback: true,
          },
          200,
        );
      }
      return json(
        {
          success: false,
          confidence: "low",
          reason: "Service d'analyse indisponible.",
          fallback: true,
        },
        200,
      );
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
      return json(
        {
          success: false,
          confidence: "low",
          reason: "Réponse IA non exploitable.",
          fallback: true,
        },
        200,
      );
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
        reason: err instanceof Error ? err.message : "Erreur inconnue",
        fallback: true,
      },
      200,
    );
  }
});
