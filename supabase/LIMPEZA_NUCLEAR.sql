-- =============================================================================
-- LIMPEZA NUCLEAR — remove TUDO que pode estar travando a criação do usuário
-- Execute no SQL Editor do Supabase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Dropar TODOS os triggers NÃO-internos em QUALQUER tabela do schema auth
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, c.relname AS tbl, t.tgname AS trg
    FROM pg_trigger t
    JOIN pg_class c      ON c.oid = t.tgrelid
    JOIN pg_namespace n  ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I;', r.trg, r.sch, r.tbl);
    RAISE NOTICE 'Trigger removido: %.%.%', r.sch, r.tbl, r.trg;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Dropar funções em public que mexem em auth.users/profiles/user_profiles
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'  -- apenas FUNÇÕES normais (exclui aggregate/window/procedure)
      AND (
        p.proname IN (
          'tg_sync_profile',
          'handle_new_user',
          'sync_user_profile',
          'create_profile_for_user',
          'sync_profile_for_email'
        )
        OR pg_get_functiondef(p.oid) ILIKE '%INSERT INTO public.profiles%'
        OR pg_get_functiondef(p.oid) ILIKE '%INSERT INTO public.user_profiles%'
      )
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE;', r.proname, r.args);
    RAISE NOTICE 'Função removida: public.%(%)', r.proname, r.args;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3) Dropar tabelas problemáticas (profiles e user_profiles) e recriar do zero
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles      CASCADE;

-- -----------------------------------------------------------------------------
-- 4) Confirmar: não deve sobrar NENHUM trigger custom em auth
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema,
  c.relname AS tabela,
  t.tgname  AS trigger_name
FROM pg_trigger t
JOIN pg_class c     ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND NOT t.tgisinternal;
-- Se essa query retornar 0 linhas, está limpo.

SELECT 'LIMPEZA COMPLETA. Agora tente criar o usuário no Dashboard.' AS status;
