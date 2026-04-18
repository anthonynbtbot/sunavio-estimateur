DO $$
BEGIN
  EXECUTE 'GRANT INSERT ON public.leads TO anon';
  EXECUTE 'GRANT INSERT ON public.leads TO authenticated';
  EXECUTE 'GRANT INSERT ON public.ai_call_log TO anon';
  EXECUTE 'GRANT INSERT ON public.ai_call_log TO authenticated';
END$$;
SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='leads';