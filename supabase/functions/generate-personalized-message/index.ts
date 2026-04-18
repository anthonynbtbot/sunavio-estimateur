import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";
import { guardLeadMutation } from "../_shared/lead-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-2.5-pro";

const SYSTEM_PROMPT = `Tu es Anthony NEBOUT, co-fondateur et ingénieur de SUNAVIO, société marocaine d'ingénierie solaire premium.

Tu dois écrire un court message personnalisé (2 à 3 phrases, 40 à 70 mots MAXIMUM) pour commenter l'étude préliminaire d'un prospect. Ce message apparaîtra en bas de son étude en ligne, signé "Anthony NEBOUT · Co-fondateur SUNAVIO".

TON STYLE :
- Personnel mais professionnel
- Vouvoiement OBLIGATOIRE (jamais de tutoiement)
- Honnête, jamais survendeur
- Pointe UN détail spécifique au projet du prospect (une opportunité, un point d'attention, une curiosité technique)
- Invite subtilement à la visite technique sans insister
- Pas d'emoji, pas de formule creuse type "nous serions ravis", "n'hésitez pas à"

RÉPONSE STRICT JSON (pas de Markdown, pas de préambule) :
{ "message": "..." }

EXEMPLES selon le cas :
- Petite conso non viable : "Votre consommation actuelle reste modeste pour que le solaire soit pleinement rentable. Je préfère vous le dire sincèrement. N'hésitez pas à revenir vers nous si votre profil énergétique évolue dans les prochaines années."
- Villa avec piscine : "Votre profil est idéal : la piscine consomme beaucoup en journée, exactement quand les panneaux produisent le plus. L'autoconsommation directe sera excellente chez vous, avec ou sans batterie."
- Essaouira : "L'ensoleillement exceptionnel d'Essaouira joue clairement en votre faveur — nous sommes sur l'une des meilleures zones de production du Maroc. La visite technique permettra d'affiner l'orientation optimale de vos panneaux."
- Toit tôle ancien : "Votre toit en tôle demandera une inspection attentive de la charpente lors de la visite technique. Rien d'insurmontable dans la plupart des cas, mais c'est un point que je tiens à vérifier sur place."
- V2 pertinente : "Avec votre profil de consommation, la version avec stockage mérite vraiment d'être considérée — vous retrouverez une vraie maîtrise de votre énergie, jour comme nuit."

IMPORTANT : chaque message doit être DIFFÉRENT. Base-toi sur un détail SPÉCIFIQUE du prospect.`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseAiJson(raw: string): any | null {
  if (!raw) return null;
  let s = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(s); } catch {
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a !== -1 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch { return null; } }
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);
  const rl = await checkRateLimit(supabase, ip, "generate-personalized-message", 20);
  if (!rl.allowed) {
    return json({ success: false, error: "rate_limit" }, 429);
  }

  try {
    const body = await req.json();
    const leadId: string | undefined = body?.leadId;

    if (leadId) {
      const guard = await guardLeadMutation(supabase, req, leadId);
      if (!guard.allowed) {
        return json({ success: false, error: "forbidden", reason: guard.reason }, 403);
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Données du prospect :\n${JSON.stringify(body, null, 2)}` },
        ],
      }),
    });

    if (aiRes.status === 429) return json({ success: false, error: "Rate limits exceeded" }, 429);
    if (aiRes.status === 402) return json({ success: false, error: "Payment required" }, 402);
    if (!aiRes.ok) {
      console.error("AI error", aiRes.status, await aiRes.text());
      return json({ success: false, error: "ai_gateway_error" }, 200);
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseAiJson(raw);
    const message = parsed?.message?.toString().trim();

    if (!message) {
      return json({ success: false, error: "parse_error" }, 200);
    }

    if (leadId) {
      await supabase.from("leads").update({ personalized_message: message }).eq("id", leadId);
    }

    await supabase.from("ai_call_log").insert({
      function_name: "generate-personalized-message",
      success: true,
    });

    return json({ success: true, message });
  } catch (err) {
    console.error("generate-personalized-message error", err);
    return json({ success: false, error: "internal_error" }, 500);
  }
});
