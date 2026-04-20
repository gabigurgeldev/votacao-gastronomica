-- =============================================================================
-- IDENTIFICAR E REMOVER TRIGGER PROBLEMÁTICO EM auth.users
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- PASSO 1: Listar TODOS os triggers em auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_orientation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- PASSO 2: Ver detalhes completos dos triggers
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- PASSO 3: Verificar se há funções associadas aos triggers
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass;

-- PASSO 4: TENTAR remover triggers problemáticos
-- Execute cada DROP TRIGGER separadamente se encontrar algum suspeito

-- Remover trigger de user_profiles se existir (comum causar erro)
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;

-- Remover qualquer trigger com nome contendo 'user' ou 'profile'
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass 
      AND (tgname LIKE '%user%' OR tgname LIKE '%profile%' OR tgname LIKE '%sync%')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
    RAISE NOTICE 'Trigger removido: %', r.tgname;
  END LOOP;
END $$;

-- PASSO 5: Verificar se há constraints problemáticas
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass
  AND contype = 'c'; -- check constraints

-- PASSO 6: Desabilitar TODOS os triggers temporariamente (workaround)
-- NOTA: Pode falhar se não for owner
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Mensagem de status
SELECT 'Triggers processados. Verifique mensagens acima.' as status;
