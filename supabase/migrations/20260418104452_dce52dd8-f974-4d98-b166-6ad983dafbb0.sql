-- 1. Enum des rôles
CREATE TYPE public.app_role AS ENUM ('admin');

-- 2. Table user_roles (séparée des profils pour éviter privilege escalation)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Fonction sécurisée pour vérifier un rôle (SECURITY DEFINER => pas de récursion RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- 4. Policies user_roles : seul admin peut tout voir / gérer ; chacun peut voir ses propres rôles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 5. Policies leads : admins peuvent SELECT et UPDATE (statut/notes)
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, UPDATE ON public.leads TO authenticated;

-- 6. Policy ai_call_log : admins peuvent SELECT (la policy existante autorise déjà à n'importe qui de read, on la remplace)
DROP POLICY IF EXISTS "Authenticated users can read AI logs" ON public.ai_call_log;
CREATE POLICY "Admins can read AI logs"
  ON public.ai_call_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Trigger sur la table leads pour mettre à jour updated_at (et idem pour user_roles si besoin futur)
-- (pas de updated_at sur leads aujourd'hui, on n'ajoute pas pour ne pas changer le schéma fonctionnel)