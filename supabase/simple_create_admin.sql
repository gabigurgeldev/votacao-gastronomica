-- =============================================================================
-- SQL SIMPLES E DIRETO para criar usuário admin
-- Execute no SQL Editor do Supabase (como owner/service_role)
-- =============================================================================

-- SENHA PADRÃO: Admin@2024!
-- Para mudar a senha, gere um novo hash em https://bcrypt-generator.com/

-- Limpar possíveis conflitos de sessão
DO $$
DECLARE
  target_email TEXT := 'admin@votacaogastronomica.com';
  target_hash  TEXT := '$2a$12$F4fRZz5qFupWG/1OoMvH4eiA3NDbDr/Z3o27tGHbzFkHoP/gp0upi';
  existing_id UUID;
BEGIN
  -- Busca usuário existente
  SELECT id INTO existing_id 
  FROM auth.users 
  WHERE email = target_email;
  
  IF existing_id IS NOT NULL THEN
    -- Remove o usuário existente para recriar limpo
    DELETE FROM auth.users WHERE id = existing_id;
    RAISE NOTICE 'Usuário antigo removido. Recriando...';
  END IF;
  
  -- Cria novo usuário admin
  INSERT INTO auth.users (
    instance_id,
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
    phone,
    phone_confirmed_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    target_email,
    target_hash,
    NOW(),
    '{"role":"admin"}',
    '{"name":"Administrador"}',
    NOW(),
    NOW(),
    NOW(),
    false,
    NULL,
    NULL
  );
  
  RAISE NOTICE '✅ Admin criado com sucesso!';
  RAISE NOTICE 'Email: %', target_email;
  RAISE NOTICE 'Senha: Admin@2024!';
END $$;

-- Verificar se foi criado
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at is not null as confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
