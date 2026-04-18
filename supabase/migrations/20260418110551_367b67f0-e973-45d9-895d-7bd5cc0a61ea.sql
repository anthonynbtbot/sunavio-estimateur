-- =========================================================
-- P1 : Sécurité RGPD + fiabilisation analyse toit (retry)
-- =========================================================

DELETE FROM public.leads;

UPDATE storage.buckets SET public = false WHERE id = 'lead-uploads';

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'lead-uploads%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "lead-uploads_insert_anyone"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'lead-uploads');

CREATE POLICY "lead-uploads_select_admin"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "lead-uploads_update_admin"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lead-uploads' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'lead-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "lead-uploads_delete_admin"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lead-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  payload jsonb,
  status text
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_logs_admin_read" ON public.system_logs;
CREATE POLICY "system_logs_admin_read"
ON public.system_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ai_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  count int NOT NULL DEFAULT 1,
  UNIQUE (ip_hash, endpoint, window_start)
);
ALTER TABLE public.ai_rate_limit ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_rate_limit_window_idx ON public.ai_rate_limit (window_start);

-- DROP préalable pour pouvoir changer le type de retour
DROP FUNCTION IF EXISTS public.submit_lead(jsonb);

CREATE FUNCTION public.submit_lead(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  v_full_name text := payload->>'full_name';
  v_phone text := payload->>'phone';
  v_email text := payload->>'email';
  v_city text := payload->>'city';
  v_consumption numeric := NULLIF(payload->>'consumption_kwh_year','')::numeric;
  v_housing text := payload->>'housing_type';
  v_roof text := payload->>'roof_type';
BEGIN
  IF v_full_name IS NULL OR length(trim(v_full_name)) < 2 OR length(v_full_name) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_full_name');
  END IF;

  IF v_phone IS NULL OR v_phone !~ '^(\+?212|0)[\s.\-]?[5-7][0-9]([\s.\-]?[0-9]){7}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_phone');
  END IF;

  IF v_email IS NOT NULL AND v_email <> '' AND
     v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_email');
  END IF;

  IF v_city IS NOT NULL AND v_city <> '' AND
     (length(v_city) < 2 OR length(v_city) > 50) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_city');
  END IF;

  IF v_consumption IS NOT NULL AND (v_consumption < 500 OR v_consumption > 100000) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_consumption');
  END IF;

  IF v_housing IS NOT NULL AND v_housing NOT IN ('villa','maison','appartement','autre') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_housing_type');
  END IF;
  IF v_roof IS NOT NULL AND v_roof NOT IN ('terrasse','tuile','tole','autre') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_roof_type');
  END IF;

  INSERT INTO public.leads (
    full_name, phone, email, city, address, lat, lng,
    consumption_kwh_year, housing_type, roof_type,
    has_ac, has_pool, has_ev,
    recommended_kwc, estimated_production_kwh,
    estimated_budget_min, estimated_budget_max, estimated_roi_years,
    invoice_photo_url, invoice_ai_extracted, invoice_ai_confidence,
    roof_photos_urls, status
  ) VALUES (
    trim(v_full_name), v_phone, NULLIF(v_email, ''), NULLIF(v_city, ''),
    payload->>'address',
    NULLIF(payload->>'lat','')::numeric,
    NULLIF(payload->>'lng','')::numeric,
    v_consumption, v_housing, v_roof,
    NULLIF(payload->>'has_ac','')::boolean,
    NULLIF(payload->>'has_pool','')::boolean,
    NULLIF(payload->>'has_ev','')::boolean,
    NULLIF(payload->>'recommended_kwc','')::numeric,
    NULLIF(payload->>'estimated_production_kwh','')::numeric,
    NULLIF(payload->>'estimated_budget_min','')::numeric,
    NULLIF(payload->>'estimated_budget_max','')::numeric,
    NULLIF(payload->>'estimated_roi_years','')::numeric,
    payload->>'invoice_photo_url',
    payload->'invoice_ai_extracted',
    payload->>'invoice_ai_confidence',
    CASE WHEN jsonb_typeof(payload->'roof_photos_urls') = 'array'
         THEN ARRAY(SELECT jsonb_array_elements_text(payload->'roof_photos_urls'))
         ELSE NULL END,
    COALESCE(payload->>'status', 'new')
  )
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('success', true, 'id', new_id);
END;
$$;

-- pg_net + Vault + trigger
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'service_role_key') THEN
    PERFORM vault.create_secret('PLACEHOLDER_TO_BE_SET', 'service_role_key', 'Service role key for pg_net edge function calls');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'project_url') THEN
    PERFORM vault.create_secret(
      'https://wzwwnlsdxpvckkpqmijr.supabase.co',
      'project_url',
      'Supabase project base URL'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trigger_roof_analysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key text;
  v_url text;
  v_request_id bigint;
BEGIN
  IF NEW.roof_photos_urls IS NULL OR array_length(NEW.roof_photos_urls, 1) IS NULL
     OR array_length(NEW.roof_photos_urls, 1) < 2 THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets WHERE name = 'project_url';

  IF v_key IS NULL OR v_key = 'PLACEHOLDER_TO_BE_SET' OR v_url IS NULL THEN
    INSERT INTO public.system_logs (event_type, status, payload)
    VALUES ('roof_analysis_trigger', 'skipped_no_secret',
            jsonb_build_object('lead_id', NEW.id));
    RETURN NEW;
  END IF;

  SELECT net.http_post(
    url := v_url || '/functions/v1/analyze-roof',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'leadId', NEW.id,
      'photoPaths', NEW.roof_photos_urls
    ),
    timeout_milliseconds := 60000
  ) INTO v_request_id;

  INSERT INTO public.system_logs (event_type, status, payload)
  VALUES ('roof_analysis_trigger', 'dispatched',
          jsonb_build_object('lead_id', NEW.id, 'request_id', v_request_id));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.system_logs (event_type, status, payload)
  VALUES ('roof_analysis_trigger', 'error',
          jsonb_build_object('lead_id', NEW.id, 'error', SQLERRM));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_roof_analysis_on_lead_insert ON public.leads;
CREATE TRIGGER trigger_roof_analysis_on_lead_insert
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_roof_analysis();