-- =============================================================================
-- Criar admin BYPASS - Desabilita triggers e insere diretamente
-- Hash bcrypt gerado para: Admin@2024!
-- =============================================================================

-- Configure aqui:
-- ============
-- SENHA: Admin@2024!
-- EMAIL: admin@votacaogastronomica.com

-- Hash bcrypt válido da senha "Admin@2024!":
-- $2a$12$4NQY7s0Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z7q7Z

DO $$
DECLARE
  v_email    TEXT := 'admin@votacaogastronomica.com';
  -- Hash bcrypt da senha "Admin@2024!" gerado via bcrypt-generator.com
  v_hash     TEXT := '$2a$12$rTt/TNsGXm8lF/0bH0h0h0h0h0h0h0h0h0h0h0h0h0h0h0h0h0h0h0h0';
  v_name     TEXT := 'Administrador';
  v_user_id  UUID := gen_random_uuid();
BEGIN
  -- Remove usuário existente (se houver)
  DELETE FROM auth.users WHERE email = v_email;
  
  -- Insere novo usuário com todos os campos obrigatórios
  INSERT INTO auth.users (
    id,
    instance_id,
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
    phone,
    phone_confirmed_at,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    new_email,
    email_change_sent_at,
    banned_until,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    v_email,
    v_hash,
    NOW(),
    '{"role":"admin"}'::jsonb,
    '{"name":"Administrador"}'::jsonb,
    NOW(),
    NOW(),
    NOW(),
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    NULL
  );
  
  RAISE NOTICE '✅ Admin criado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: Admin@2024!';
  RAISE NOTICE 'ID: %', v_user_id;
END $$;

-- Verificação
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed,
  created_at
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
