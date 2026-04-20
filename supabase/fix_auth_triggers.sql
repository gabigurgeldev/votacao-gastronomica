-- =============================================================================
-- CORREÇÃO: Desabilitar triggers problemáticos em auth.users (se existirem)
-- Execute apenas se estiver tendo erros ao criar usuários
-- =============================================================================

-- =============================================================================
-- PASSO 1: Listar TODOS os triggers no schema auth
-- =============================================================================
SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- PASSO 2: Verificar se há funções que impedem inserção em auth.users
-- =============================================================================
SELECT 
  routine_schema,
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_type = 'FUNCTION'
  AND routine_definition LIKE '%users%';

-- =============================================================================
-- PASSO 3: Desabilitar triggers específicos em auth.users (se necessário)
-- =============================================================================
-- IMPORTANTE: Só desabilite se você tiver certeza do que está fazendo!
-- Para desabilitar um trigger específico, descomente a linha abaixo:

-- ALTER TABLE auth.users DISABLE TRIGGER nome_do_trigger;

-- =============================================================================
-- PASSO 4: Alternativa - Criar usuário usando a API do Supabase (mais seguro)
-- =============================================================================
-- Se os triggers estiverem impedindo a criação direta, use o script seed.ts
-- ou a API de admin do Supabase:
--
-- No terminal do projeto, execute:
--   npm run seed -- admin@votacaogastronomica.com Admin@2024! "Administrador"
--
-- Isso usa a SERVICE_ROLE_KEY e a API admin do Supabase Auth, que bypassa RLS
-- e triggers do banco.
--
-- =============================================================================
-- PASSO 5: Verificar configuração de RLS na tabela auth.users
-- =============================================================================
-- A tabela auth.users normalmente não tem RLS habilitada (gerenciada internamente
-- pelo Supabase Auth), mas vamos verificar:

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'auth' 
  AND tablename = 'users';

-- =============================================================================
-- PASSO 6: Verificar políticas se RLS estiver habilitado
-- =============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'auth';
