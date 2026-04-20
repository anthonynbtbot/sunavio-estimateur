-- 1. Add self-service token + consent timestamps
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS self_service_token uuid NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz,
ADD COLUMN IF NOT EXISTS accepted_contact_at timestamptz;

-- Unique constraint + index for fast token lookup
DO $$ BEGIN
  ALTER TABLE public.leads ADD CONSTRAINT leads_self_service_token_key UNIQUE (self_service_token);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_leads_self_service_token ON public.leads(self_service_token);

-- 2. Cascade delete: remove storage files when a lead is deleted
CREATE OR REPLACE FUNCTION public.delete_lead_files()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path text;
BEGIN
  IF OLD.invoice_photo_url IS NOT NULL AND length(OLD.invoice_photo_url) > 0 THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'lead-uploads' 
      AND name = OLD.invoice_photo_url;
  END IF;

  IF OLD.roof_photos_urls IS NOT NULL THEN
    FOREACH file_path IN ARRAY OLD.roof_photos_urls LOOP
      IF file_path IS NOT NULL AND length(file_path) > 0 THEN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'lead-uploads' 
          AND name = file_path;
      END IF;
    END LOOP;
  END IF;

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  -- Never block lead deletion if file cleanup fails
  INSERT INTO public.system_logs (event_type, status, payload)
  VALUES ('delete_lead_files', 'error',
          jsonb_build_object('lead_id', OLD.id, 'error', SQLERRM));
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_delete_lead_files ON public.leads;
CREATE TRIGGER trigger_delete_lead_files
BEFORE DELETE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.delete_lead_files();

-- 3. Update submit_lead to require + timestamp both consents
CREATE OR REPLACE FUNCTION public.submit_lead(payload jsonb, _ip_hash text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  new_token uuid;
  v_full_name text := payload->>'full_name';
  v_phone text := payload->>'phone';
  v_email text := payload->>'email';
  v_city text := payload->>'city';
  v_consumption numeric := NULLIF(payload->>'consumption_kwh_year','')::numeric;
  v_housing text := payload->>'housing_type';
  v_roof text := payload->>'roof_type';
  v_accept_terms boolean := COALESCE(NULLIF(payload->>'accept_terms','')::boolean, false);
  v_accept_contact boolean := COALESCE(NULLIF(payload->>'accept_contact','')::boolean, false);
  v_window_start timestamptz := date_trunc('hour', now());
  v_count int;
  v_existing_id uuid;
BEGIN
  -- Rate limit: 5 leads/hour/IP
  IF _ip_hash IS NOT NULL AND length(_ip_hash) > 0 THEN
    SELECT id, count INTO v_existing_id, v_count
    FROM public.ai_rate_limit
    WHERE ip_hash = _ip_hash
      AND endpoint = 'submit_lead'
      AND window_start = v_window_start;

    IF v_existing_id IS NULL THEN
      INSERT INTO public.ai_rate_limit (ip_hash, endpoint, window_start, count)
      VALUES (_ip_hash, 'submit_lead', v_window_start, 1);
    ELSIF v_count >= 5 THEN
      RETURN jsonb_build_object('success', false, 'error', 'rate_limit_submit');
    ELSE
      UPDATE public.ai_rate_limit SET count = count + 1 WHERE id = v_existing_id;
    END IF;
  END IF;

  -- Mandatory consents
  IF NOT v_accept_terms THEN
    RETURN jsonb_build_object('success', false, 'error', 'terms_not_accepted');
  END IF;
  IF NOT v_accept_contact THEN
    RETURN jsonb_build_object('success', false, 'error', 'contact_not_accepted');
  END IF;

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
    roof_photos_urls, status,
    accepted_terms_at, accepted_contact_at
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
    COALESCE(payload->>'status', 'new'),
    now(), now()
  )
  RETURNING id, self_service_token INTO new_id, new_token;

  RETURN jsonb_build_object('success', true, 'id', new_id, 'token', new_token);
END;
$function$;