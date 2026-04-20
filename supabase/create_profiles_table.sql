-- =============================================================================
-- CRIAR TABELA PROFILES E SINCRONIZAÇÃO COM AUTH.USERS
-- Resolve o problema de roles e armazena usuários
-- =============================================================================

-- PASSO 1: Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'jurado' CHECK (role IN ('admin', 'jurado')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE public.profiles IS 'Perfis de usuários sincronizados com auth.users';
COMMENT ON COLUMN public.profiles.role IS 'Papel: admin ou jurado';

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- PASSO 2: Função para atualizar updated_at
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
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PASSO 3: Função para sincronizar auth.users -> profiles
CREATE OR REPLACE FUNCTION public.tg_sync_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, active, created_at, updated_at)
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
    name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
    role = COALESCE(NEW.raw_app_meta_data->>'role', profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- PASSO 4: Criar trigger em auth.users (se tivermos permissão)
-- Se não tiver permissão, precisaremos sincronizar manualmente
DO $$
BEGIN
  DROP TRIGGER IF EXISTS sync_profile_trigger ON auth.users;
  CREATE TRIGGER sync_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_sync_profile();
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Sem permissao para criar trigger em auth.users (normal)';
  RAISE NOTICE 'Sincronizacao sera manual via script';
END $$;

-- PASSO 5: Sincronizar usuários existentes
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
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- PASSO 6: Criar funções auxiliares para verificar roles
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_profile_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_profile_jury()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'jurado' AND active = true
  );
$$;

-- PASSO 7: Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Admin vê tudo
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_profile_admin())
  WITH CHECK (public.is_profile_admin());

-- Usuário vê só o próprio
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- PASSO 8: Criar view para admin ver todos
CREATE OR REPLACE VIEW public.v_profiles AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  p.active,
  p.created_at,
  p.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- PASSO 9: Criar usuário admin se não existir (via profiles + auth.users)
DO $$
DECLARE
  v_email TEXT := 'admin@votacaogastronomica.com';
  v_user_id UUID;
BEGIN
  -- Verificar se já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    -- Inserir em auth.users primeiro (se tivermos permissão)
    -- Se não tiver, o admin precisa ser criado via Dashboard
    RAISE NOTICE 'Admin nao existe no auth.users';
    RAISE NOTICE 'Crie via Dashboard ou execute: npm run seed -- admin@email.com senha "Nome"';
  ELSE
    -- Garantir que está em profiles com role admin
    INSERT INTO public.profiles (id, email, name, role, active)
    VALUES (v_user_id, v_email, 'Administrador', 'admin', true)
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      name = 'Administrador',
      active = true,
      updated_at = NOW();
    
    RAISE NOTICE 'Admin sincronizado: %', v_email;
  END IF;
END $$;

-- PASSO 10: Verificação final
SELECT 
  p.id,
  p.email,
  p.name,
  p.role,
  p.active,
  au.email_confirmed_at IS NOT NULL as confirmed
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.role, p.created_at DESC;
