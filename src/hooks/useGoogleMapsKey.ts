import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedKey: string | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchKey(): Promise<string | null> {
  if (cachedKey) return cachedKey;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("get-maps-config");
    if (error || !data?.success) return null;
    cachedKey = data.apiKey as string;
    return cachedKey;
  })();
  const key = await inflight;
  inflight = null;
  return key;
}

export function useGoogleMapsKey() {
  const [apiKey, setApiKey] = useState<string | null>(cachedKey);
  const [loading, setLoading] = useState(!cachedKey);

  useEffect(() => {
    if (cachedKey) {
      setApiKey(cachedKey);
      setLoading(false);
      return;
    }
    let active = true;
    fetchKey().then((k) => {
      if (active) {
        setApiKey(k);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { apiKey, loading };
}
