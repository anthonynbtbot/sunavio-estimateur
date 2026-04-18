CREATE OR REPLACE FUNCTION public.set_service_role_secret(_value text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_id uuid;
  v_current text;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'service_role_key';
  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'secret_not_found');
  END IF;

  SELECT decrypted_secret INTO v_current
  FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_current IS NOT NULL AND v_current <> 'PLACEHOLDER_TO_BE_SET' AND length(v_current) > 40 THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_set');
  END IF;

  PERFORM vault.update_secret(v_id, _value);

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.set_service_role_secret(text) FROM PUBLIC, anon, authenticated;