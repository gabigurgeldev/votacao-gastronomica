-- =============================================================================
-- FIX DEFINITIVO: "Database error creating new user" no Dashboard do Supabase
-- =============================================================================
-- CAUSA: Triggers criados em auth.users por scripts anteriores estão quebrando
--        o INSERT do Dashboard (ex.: sync_profile_trigger chamando uma função
--        que falha por NOT NULL, RLS, ou referência inválida).
--
-- SOLUÇÃO: Remover TODOS os triggers/funções problemáticas em auth.users,
--          manter a tabela profiles, e sincronizar manualmente DEPOIS de
--          criar o usuário no Dashboard (sem trigger automático que aborta).
--
-- COMO USAR:
--   1) Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
--   2) Crie o usuário pelo Dashboard > Authentication > Users > Add user.
--   3) Rode o bloco "SINCRONIZAR USUÁRIO" no final para marcar como admin.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PARTE 1: Remover TODOS os triggers customizados em auth.users
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS sync_profile_trigger        ON auth.users;
DROP TRIGGER IF EXISTS sync_user_profile_trigger   ON auth.users;
DROP TRIGGER IF EXISTS user_profile_sync           ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created        ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user             ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated        ON auth.users;

-- Remover funções antigas que podem estar sendo chamadas por triggers residuais
DROP FUNCTION IF EXISTS public.tg_sync_profile()          CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user()          CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile()        CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user()  CASCADE;

-- Varredura de segurança: dropar qualquer trigger NÃO-nativo restante em auth.users
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal           -- não tocar nos internos do Postgres
      AND tgname NOT LIKE 'RI_%'     -- não tocar em constraints de FK
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', t.tgname);
    RAISE NOTICE 'Trigger removido de auth.users: %', t.tgname;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- PARTE 2: Garantir tabela profiles SEM trigger automático em auth.users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  name       TEXT,
  role       TEXT NOT NULL DEFAULT 'jurado' CHECK (role IN ('admin', 'jurado')),
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role   ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_email  ON public.profiles(email);

-- Trigger APENAS para updated_at na própria tabela profiles (seguro)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND p.active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin' AND p.active = true)
  );

-- -----------------------------------------------------------------------------
-- PARTE 3: Função RPC para sincronizar/promover usuário DEPOIS de criá-lo
--           (segura, SECURITY DEFINER, chamada manualmente)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_for_email(
  p_email TEXT,
  p_name  TEXT DEFAULT NULL,
  p_role  TEXT DEFAULT 'jurado'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_role NOT IN ('admin', 'jurado') THEN
    RAISE EXCEPTION 'role deve ser admin ou jurado';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado em auth.users: %', p_email;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, active)
  VALUES (v_user_id, p_email, COALESCE(p_name, 'Usuário'), p_role, true)
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    name       = COALESCE(EXCLUDED.name, public.profiles.name),
    role       = EXCLUDED.role,
    active     = true,
    updated_at = NOW();

  -- Também grava o role no app_metadata do JWT (usado pelas RLS is_admin/is_jury)
  UPDATE auth.users
  SET raw_app_meta_data =
        COALESCE(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', p_role)
  WHERE id = v_user_id;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_for_email(TEXT, TEXT, TEXT) FROM public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- PARTE 4: Sincronizar usuários que já existam em auth.users
-- -----------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, name, role, active, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(au.raw_app_meta_data->>'role', 'jurado'),
  true,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- PARTE 5: Verificação — confirmar que não há mais triggers custom em auth.users
-- -----------------------------------------------------------------------------
SELECT
  tgname AS trigger_name,
  CASE WHEN tgisinternal THEN 'interno (ok)' ELSE 'CUSTOM (revisar)' END AS tipo
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgisinternal DESC, tgname;

SELECT 'PRONTO. Agora crie o usuário no Dashboard > Authentication > Users.' AS status;

-- =============================================================================
-- PARTE 6: SINCRONIZAR USUÁRIO (rode DEPOIS de criar no Dashboard)
-- =============================================================================
-- Descomente as linhas abaixo, ajuste o email/nome e execute.
-- Isso cria o profile + define role=admin no app_metadata (JWT).
-- -----------------------------------------------------------------------------

-- SELECT public.sync_profile_for_email(
--   'admin@votacaogastronomica.com',   -- email que você usou no Dashboard
--   'Administrador',                    -- nome
--   'admin'                             -- role: 'admin' ou 'jurado'
-- );

-- Conferir:
-- SELECT p.id, p.email, p.name, p.role, p.active, au.email_confirmed_at
-- FROM public.profiles p
-- LEFT JOIN auth.users au ON au.id = p.id
-- ORDER BY p.created_at DESC;
