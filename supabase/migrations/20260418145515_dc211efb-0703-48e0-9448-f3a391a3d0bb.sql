-- 1. Restrict bucket size & MIME types
UPDATE storage.buckets
SET 
  file_size_limit = 10485760,  -- 10 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]
WHERE id = 'lead-uploads';

-- 2. Per-IP rate limit on lead submissions (5/hour)
CREATE OR REPLACE FUNCTION public.submit_lead(payload jsonb, _ip_hash text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  v_full_name text := payload->>'full_name';
  v_phone text := payload->>'phone';
  v_email text := payload->>'email';
  v_city text := payload->>'city';
  v_consumption numeric := NULLIF(payload->>'consumption_kwh_year','')::numeric;
  v_housing text := payload->>'housing_type';
  v_roof text := payload->>'roof_type';
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
$function$;