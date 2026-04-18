// Google Places Autocomplete proxy, restricted to Morocco.

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

  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) return json({ success: false, error: "missing_api_key" }, 500);

  try {
    const body = await req.json();
    const input: string = (body?.input ?? "").toString().trim();
    const sessionToken: string | undefined = body?.session_token;
    if (input.length < 2) return json({ success: true, predictions: [] });

    const params = new URLSearchParams({
      input,
      key: apiKey,
      components: "country:ma",
      language: "fr",
    });
    if (sessionToken) params.set("sessiontoken", sessionToken);

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "ZERO_RESULTS") {
      return json({ success: true, predictions: [] });
    }
    if (data.status !== "OK") {
      console.error("Places autocomplete error", data.status, data.error_message);
      return json({ success: false, error: data.status });
    }

    const predictions = (data.predictions ?? []).slice(0, 5).map((p: any) => ({
      description: p.description,
      place_id: p.place_id,
      main_text: p.structured_formatting?.main_text ?? p.description,
      secondary_text: p.structured_formatting?.secondary_text ?? "",
    }));

    return json({ success: true, predictions });
  } catch (err) {
    console.error("places-autocomplete error", err);
    return json({ success: false, error: "internal_error" }, 500);
  }
});
