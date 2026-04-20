-- =============================================================================
-- CRIAÇÃO: Tabela pública user_profiles para gerenciar usuários e roles
-- Esta tabela espelha os dados de auth.users para fácil consulta
-- =============================================================================

-- =============================================================================
-- PASSO 1: Criar tabela de perfis de usuários
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'jurado' CHECK (role IN ('admin', 'jurado')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários na tabela
COMMENT ON TABLE public.user_profiles IS 'Perfil dos usuários do sistema (admin e jurados)';
COMMENT ON COLUMN public.user_profiles.role IS 'Papel do usuário: admin ou jurado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- =============================================================================
-- PASSO 2: Criar função para atualizar updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =============================================================================
-- PASSO 3: Criar trigger para sincronizar com auth.users
-- =============================================================================
-- Esta função cria automaticamente um perfil quando um usuário é criado no auth
CREATE OR REPLACE FUNCTION public.tg_sync_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(NEW.raw_app_meta_data->>'role', 'jurado'),
    true,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', user_profiles.name),
    role = COALESCE(NEW.raw_app_meta_data->>'role', user_profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger que dispara após insert/update em auth.users
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_sync_user_profile();

-- =============================================================================
-- PASSO 4: Habilitar RLS na tabela
-- =============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Admin pode ver e editar tudo
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Jurado pode ver apenas o próprio perfil
DROP POLICY IF EXISTS "user_profiles_jurado_select_own" ON public.user_profiles;
CREATE POLICY "user_profiles_jurado_select_own" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- =============================================================================
-- PASSO 5: Sincronizar usuários existentes
-- =============================================================================
INSERT INTO public.user_profiles (id, email, name, role, active, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  COALESCE(au.raw_app_meta_data->>'role', 'jurado'),
  true,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PASSO 6: Verificar a sincronização
-- =============================================================================
SELECT 
  up.id,
  up.email,
  up.name,
  up.role,
  up.active,
  up.created_at
FROM public.user_profiles up
ORDER BY up.role, up.created_at DESC;

-- =============================================================================
-- PASSO 7: Criar view para facilitar consultas
-- =============================================================================
CREATE OR REPLACE VIEW public.v_users AS
SELECT 
  up.id,
  up.email,
  up.name,
  up.role,
  up.active,
  up.created_at,
  up.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id;

-- Comentário na view
COMMENT ON VIEW public.v_users IS 'View combinada de user_profiles e auth.users para admin';

-- Política RLS para a view (security invoker)
-- Note: views não têm RLS diretamente, herdando das tabelas base

-- =============================================================================
-- INSTRUÇÕES DE USO:
-- =============================================================================
-- 1. Execute este SQL no Supabase Dashboard → SQL Editor
-- 2. Após criar, você pode consultar usuários com:
--    SELECT * FROM public.user_profiles;
-- 3. Ou usar a view completa:
--    SELECT * FROM public.v_users;
-- 4. Para criar um novo admin via SQL direto agora (usando a nova estrutura):
--    - Use o script fix_admin_creation.sql
--    - O perfil será criado automaticamente pelo trigger
--
-- =============================================================================
