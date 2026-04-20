-- =============================================================================
-- CORREÇÃO: Criar usuário ADMIN no Supabase Auth
-- Execute no SQL Editor do Supabase com permissões de superuser/service_role
-- =============================================================================

-- =============================================================================
-- PASSO 0: Verificar se existe algum trigger problemático em auth.users
-- =============================================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- =============================================================================
-- PASSO 1: Verificar/Criar extensão pgcrypto (necessária para gen_random_uuid)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PASSO 2: Criar função auxiliar para gerar hash bcrypt (se não existir)
-- =============================================================================
-- O Supabase já tem a extensão pgcrypto, mas precisamos de bcrypt
-- Nota: O hash abaixo foi gerado para a senha: "Admin@2024!"
-- Para gerar um novo hash, use: https://bcrypt-generator.com/

-- =============================================================================
-- PASSO 3: Criar usuário admin (SOLUÇÃO COMPLETA E ROBUSTA)
-- =============================================================================

DO $$
DECLARE
  v_email TEXT := 'admin@votacaogastronomica.com';
  -- HASH da senha "Admin@2024!" - Substitua se quiser outra senha
  v_password_hash TEXT := '$2a$12$F4fRZz5qFupWG/1OoMvH4eiA3NDbDr/Z3o27tGHbzFkHoP/gp0upi';
  v_name TEXT := 'Administrador';
  v_user_id UUID;
  v_instance_id UUID;
BEGIN
  -- Obter o instance_id do projeto (geralmente é um UUID específico ou NULL)
  -- Se houver usuários existentes, pegamos o instance_id deles
  SELECT instance_id INTO v_instance_id
  FROM auth.users
  LIMIT 1;

  -- Verifica se o usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Atualiza usuário existente
    UPDATE auth.users
    SET 
      encrypted_password = v_password_hash,
      email_confirmed_at = NOW(),
      raw_app_meta_data = '{"role": "admin"}'::jsonb,
      raw_user_meta_data = jsonb_build_object('name', v_name),
      updated_at = NOW(),
      is_super_admin = false,
      role = 'authenticated'
    WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Usuário admin atualizado: %', v_email;
  ELSE
    -- Cria novo usuário com TODOS os campos obrigatórios
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_sent_at,
      is_super_admin,
      instance_id,
      phone,
      phone_confirmed_at,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      new_email,
      email_change_sent_at
    ) VALUES (
      gen_random_uuid(),           -- id
      'authenticated',              -- aud (audience)
      'authenticated',              -- role
      v_email,                      -- email
      v_password_hash,              -- encrypted_password
      NOW(),                        -- email_confirmed_at
      '{"role": "admin"}'::jsonb,   -- raw_app_meta_data (IMPORTANTE!)
      jsonb_build_object('name', v_name),  -- raw_user_meta_data
      NOW(),                        -- created_at
      NOW(),                        -- updated_at
      NOW(),                        -- confirmation_sent_at
      FALSE,                        -- is_super_admin
      v_instance_id,                -- instance_id (pode ser NULL)
      NULL,                         -- phone
      NULL,                         -- phone_confirmed_at
      NULL,                         -- recovery_sent_at
      NULL,                         -- email_change_token_new
      NULL,                         -- email_change
      NULL,                         -- new_email
      NULL                          -- email_change_sent_at
    );
    
    RAISE NOTICE '✅ Usuário admin criado: %', v_email;
  END IF;
END $$;

-- =============================================================================
-- PASSO 4: Verificação da criação
-- =============================================================================
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';

-- =============================================================================
-- PASSO 5: Instruções para testar o login
-- =============================================================================
-- Após executar este script com sucesso:
--
-- 1. Verifique em: Supabase Dashboard → Authentication → Users
--    O usuário admin@votacaogastronomica.com deve aparecer lá
--
-- 2. Faça login em: http://localhost:3002/admin/login
--    Email: admin@votacaogastronomica.com
--    Senha: Admin@2024!
--
-- =============================================================================
-- PROBLEMAS COMUNS E SOLUÇÕES:
-- =============================================================================
--
-- ERRO: "permission denied for schema auth"
-- SOLUÇÃO: Execute no SQL Editor do Supabase com uma conta que tenha
--          permissões de superuser ou service_role
--
-- ERRO: "unique constraint violation on auth.users_email_key"
-- SOLUÇÃO: O email já existe, o script acima vai atualizar em vez de criar
--
-- ERRO: "column aud cannot be null"
-- SOLUÇÃO: O script acora inclui todos os campos obrigatórios
--
-- =============================================================================
