-- =============================================================================
-- CRIAR ADMIN - VERSÃO MINIMALISTA (sem hash manual)
-- Depois de criar, use o painel do Supabase para definir a senha
-- ou execute: npm run seed -- admin@email.com SENHA "Nome"
-- =============================================================================

-- Desabilitar triggers temporariamente
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Criar usuário admin
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@votacaogastronomica.com',
  '$2a$10$use_api_to_change_this',  -- placeholder, senha será definida via API
  NOW(),
  '{"role":"admin"}',
  '{"name":"Administrador"}',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  raw_app_meta_data = '{"role":"admin"}',
  raw_user_meta_data = '{"name":"Administrador"}',
  updated_at = NOW();

-- Reabilitar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- Verificar
SELECT id, email, raw_app_meta_data->>'role' as role
FROM auth.users WHERE email = 'admin@votacaogastronomica.com';

-- =============================================================================
-- PRÓXIMO PASSO:
-- 1. Vá em Supabase Dashboard → Authentication → Users
-- 2. Encontre admin@votacaogastronomica.com
-- 3. Clique no usuário → "Send password reset" ou defina senha manualmente
-- Ou execute no terminal: npm run seed -- admin@votacaogastronomica.com SENHA "Administrador"
-- =============================================================================
