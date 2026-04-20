-- =============================================================================
-- REMOVER TRIGGERS PROBLEMÁTICOS EM auth.users
-- Execute este primeiro, depois use: npm run seed
-- =============================================================================

-- Listar todos os triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- Remover trigger de sincronização de perfil (se existir e estiver causando problema)
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;

-- Remover qualquer trigger na tabela auth.users que possa estar impedindo inserts
-- DESCOMENTE A LINHA ABAIXO SE QUISER REMOVER TODOS OS TRIGGERS:
-- ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Verificar se existe a tabela user_profiles e remover triggers relacionados
DROP TRIGGER IF EXISTS user_profiles_set_updated_at ON public.user_profiles;

-- Mensagem de confirmação
SELECT 'Triggers removidos. Agora execute: npm run seed -- admin@email.com senha "Nome"' as instrucao;
