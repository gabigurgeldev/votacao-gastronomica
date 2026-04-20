-- =============================================================================
-- DIAGNÓSTICO COMPLETO — por que o Dashboard falha ao criar usuário
-- Rode TUDO e copie o resultado de CADA bloco para me enviar.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) TODOS os triggers em TODAS as tabelas do schema auth
-- -----------------------------------------------------------------------------
SELECT
  n.nspname        AS schema,
  c.relname        AS tabela,
  t.tgname         AS trigger_name,
  p.proname        AS funcao,
  p.pronamespace::regnamespace AS funcao_schema,
  t.tgisinternal   AS interno,
  pg_get_triggerdef(t.oid) AS definicao
FROM pg_trigger t
JOIN pg_class c  ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'auth'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- -----------------------------------------------------------------------------
-- 2) Tabelas em public com FK -> auth.users (qualquer trigger nelas também afeta)
-- -----------------------------------------------------------------------------
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
 AND kcu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users';

-- -----------------------------------------------------------------------------
-- 3) TODAS as funções em public cujo corpo menciona auth.users ou profiles
-- -----------------------------------------------------------------------------
SELECT
  n.nspname  AS schema,
  p.proname  AS funcao,
  pg_get_function_arguments(p.oid) AS args,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS seguranca
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- apenas funções (exclui aggregate/window/procedure)
  AND (
    pg_get_functiondef(p.oid) ILIKE '%auth.users%'
    OR pg_get_functiondef(p.oid) ILIKE '%profiles%'
    OR pg_get_functiondef(p.oid) ILIKE '%user_profiles%'
  )
ORDER BY p.proname;

-- -----------------------------------------------------------------------------
-- 4) Extensões instaladas (pgcrypto precisa existir)
-- -----------------------------------------------------------------------------
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- -----------------------------------------------------------------------------
-- 5) Colunas de auth.users — detectar se algo foi alterado manualmente
-- -----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- -----------------------------------------------------------------------------
-- 6) Últimos usuários em auth.users (pode ter resto de tentativas quebradas)
-- -----------------------------------------------------------------------------
SELECT id, email, created_at, email_confirmed_at, deleted_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- -----------------------------------------------------------------------------
-- 7) Tabela user_profiles existe? (pode estar conflitando com profiles)
-- -----------------------------------------------------------------------------
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('profiles', 'user_profiles')
ORDER BY table_schema, table_name;
