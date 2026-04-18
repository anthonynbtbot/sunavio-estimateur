import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve relative storage paths (or legacy public URLs) into short-lived
 * signed URLs via the get-signed-url edge function. Admin auth required.
 */
export function useSignedUrls(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const key = paths.filter(Boolean).join("|");

  useEffect(() => {
    const clean = paths.filter((p): p is string => !!p && p.length > 0);
    if (clean.length === 0) {
      setUrls({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.functions.invoke("get-signed-url", {
        body: { paths: clean },
      });
      if (cancelled) return;
      if (error || !data?.urls) {
        setUrls({});
      } else {
        const map: Record<string, string> = {};
        for (const r of data.urls as { path: string; signedUrl: string | null }[]) {
          if (r.signedUrl) map[r.path] = r.signedUrl;
        }
        setUrls(map);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { urls, loading };
}
