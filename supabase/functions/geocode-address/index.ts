// Geocode an address or Plus Code using Google Geocoding API.
// Also supports reverse geocoding via { lat, lng } input.
// Also supports place_id lookup via { place_id } input.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLUS_CODE_GLOBAL = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3}$/i;
const PLUS_CODE_LOCAL = /^[23456789CFGHJMPQRVWX]{4,6}\+[23456789CFGHJMPQRVWX]{2,3}\s+.+$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function detectInputType(input: string): "plus_code" | "address" {
  const trimmed = input.trim();
  if (PLUS_CODE_GLOBAL.test(trimmed) || PLUS_CODE_LOCAL.test(trimmed)) {
    return "plus_code";
  }
  return "address";
}

function extractCity(addressComponents: any[]): string | null {
  if (!Array.isArray(addressComponents)) return null;
  const locality = addressComponents.find((c) => c.types?.includes("locality"));
  if (locality) return locality.long_name;
  const admin2 = addressComponents.find((c) => c.types?.includes("administrative_area_level_2"));
  if (admin2) return admin2.long_name;
  const admin1 = addressComponents.find((c) => c.types?.includes("administrative_area_level_1"));
  return admin1?.long_name ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = getClientIp(req);
  const rl = await checkRateLimit(supabase, ip, "geocode-address", 60);
  if (!rl.allowed) {
    return json({ success: false, error: "rate_limit", retry_after: rl.retryAfter }, 429);
  }

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return json({ success: false, error: "missing_api_key" }, 500);

  try {
    const body = await req.json();
    const { input, lat, lng, place_id } = body ?? {};

    let url: string;
    let inputType: "plus_code" | "address" | "reverse" | "place_id" = "address";

    if (place_id && typeof place_id === "string") {
      if (place_id.length > 200) return json({ success: false, error: "invalid_input" }, 400);
      url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(place_id)}&key=${apiKey}&language=fr&region=ma`;
      inputType = "place_id";
    } else if (typeof lat === "number" && typeof lng === "number") {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=fr&region=ma`;
      inputType = "reverse";
    } else if (typeof input === "string" && input.trim().length > 0) {
      const trimmed = input.trim();
      if (trimmed.length > 250) return json({ success: false, error: "invalid_input" }, 400);
      inputType = detectInputType(trimmed);
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${apiKey}&language=fr&region=ma`;
    } else {
      return json({ success: false, error: "invalid_input" }, 400);
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "ZERO_RESULTS") {
      return json({ success: false, error: "not_found" });
    }
    if (data.status === "OVER_QUERY_LIMIT") {
      return json({ success: false, error: "quota_exceeded" }, 429);
    }
    if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
      console.error("Geocoding error", data.status, data.error_message);
      return json({ success: false, error: "api_error", details: data.status });
    }

    const result = data.results[0];
    const location = result.geometry?.location;
    const city = extractCity(result.address_components ?? []);

    return json({
      success: true,
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      city,
      place_id: result.place_id,
      input_type: inputType,
      confidence: result.geometry?.location_type === "ROOFTOP" ? "high" : "medium",
    });
  } catch (err) {
    console.error("geocode-address error", err);
    return json({ success: false, error: "internal_error" }, 500);
  }
});
