-- =============================================================================
-- REMOVER TODOS OS TRIGGERS QUE POSSAM ESTAR CAUSANDO PROBLEMAS
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- Listar triggers na tabela auth.users
SELECT 'Triggers em auth.users:' as info;

SELECT 
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED (origin)'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'ENABLED (replica)'
    WHEN 'A' THEN 'ALWAYS'
  END as status
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass
  AND tgname NOT LIKE 'pg_%'; -- excluir triggers internos do postgres

-- Listar triggers em public.user_profiles (se existir)
DO $$
BEGIN
  RAISE NOTICE 'Triggers em public.user_profiles (se existir):';
  PERFORM tgname, tgenabled 
  FROM pg_trigger 
  WHERE tgrelid = 'public.user_profiles'::regclass;
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'Tabela public.user_profiles nao existe (normal)';
END $$;

-- Remover trigger de sync em auth.users
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS user_profile_sync ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_created ON auth.users;

-- Remover triggers em user_profiles que possam afetar auth.users
DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;

-- Mensagem final
SELECT 'Triggers removidos. Tente criar o usuário agora.' as status;
