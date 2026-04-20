-- =============================================================================
-- SQL para criar usuário ADMIN no Supabase Auth
-- Execute no SQL Editor do Supabase (como owner/service_role)
-- =============================================================================

-- =============================================================================
-- OPÇÃO 1: Usando função auth.create_user (recomendado - se disponível)
-- =============================================================================

-- Descomente e execute se sua instância suportar:
-- SELECT auth.create_user(
--   jsonb_build_object(
--     'email', 'admin@seudominio.com',
--     'password', 'SuaSenhaForte123!',
--     'email_confirm', true,
--     'app_metadata', '{"role": "admin"}',
--     'user_metadata', '{"name": "Administrador"}'
--   )
-- );

-- =============================================================================
-- OPÇÃO 2: Inserção direta na tabela (mais compatível)
-- Gere o hash bcrypt da sua senha em: https://bcrypt-generator.com/
-- Exemplo: senha "Admin@2024!" = $2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEJH1I0VDnF/9hBBOu
-- =============================================================================

DO $$
DECLARE
  v_email TEXT := 'admin@votacaogastronomica.com';
  -- HASH DA SENHA "Admin@2024!" - Substitua pelo seu próprio hash em https://bcrypt-generator.com/
  v_password_hash TEXT := '$2a$12$F4fRZz5qFupWG/1OoMvH4eiA3NDbDr/Z3o27tGHbzFkHoP/gp0upi';
  v_name TEXT := 'Administrador';
  v_user_id UUID;
BEGIN
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
      raw_app_meta_data = '{"role": "admin"}',
      raw_user_meta_data = jsonb_build_object('name', v_name),
      updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário admin atualizado: %', v_email;
  ELSE
    -- Cria novo usuário
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
      is_super_admin
    ) VALUES (
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      v_password_hash,
      NOW(),
      '{"role": "admin"}',
      jsonb_build_object('name', v_name),
      NOW(),
      NOW(),
      NOW(),
      FALSE
    );
    
    RAISE NOTICE 'Usuário admin criado: %', v_email;
  END IF;
END $$;

-- =============================================================================
-- INSTRUÇÕES PASSO A PASSO:
-- 
-- 1. Acesse: https://bcrypt-generator.com/
-- 2. Digite sua senha desejada (ex: "Admin@2024!")
-- 3. Copie o hash gerado (começa com $2a$10$...)
-- 4. Cole o hash na linha "v_password_hash" acima, substituindo o exemplo
-- 5. Altere o email em "v_email" se desejar
-- 6. No Supabase Dashboard, vá em: SQL Editor → New query
-- 7. Cole este SQL completo e execute
-- 8. Verifique em Authentication → Users se o admin aparece
-- 9. Faça login em: http://localhost:3000/admin/login
--
-- SENHA PADRÃO DO EXEMPLO ACIMA: Admin@2024!
-- (Se quiser usar outra senha, gere um novo hash)
-- =============================================================================

-- Verificação rápida após execução:
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
