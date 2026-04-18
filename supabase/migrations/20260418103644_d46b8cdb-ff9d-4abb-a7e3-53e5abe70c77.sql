CREATE OR REPLACE FUNCTION public.submit_lead(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.leads (
    full_name, phone, email, city, address, lat, lng,
    consumption_kwh_year, housing_type, roof_type,
    has_ac, has_pool, has_ev,
    recommended_kwc, estimated_production_kwh,
    estimated_budget_min, estimated_budget_max, estimated_roi_years,
    invoice_photo_url, invoice_ai_extracted, invoice_ai_confidence,
    roof_photos_urls, status
  ) VALUES (
    payload->>'full_name',
    payload->>'phone',
    payload->>'email',
    payload->>'city',
    payload->>'address',
    NULLIF(payload->>'lat','')::numeric,
    NULLIF(payload->>'lng','')::numeric,
    NULLIF(payload->>'consumption_kwh_year','')::numeric,
    payload->>'housing_type',
    payload->>'roof_type',
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
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_lead(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_lead(jsonb) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';