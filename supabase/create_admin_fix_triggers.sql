-- =============================================================================
-- CORREÇÃO FINAL: Criar admin desabilitando triggers problemáticos
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- PASSO 1: Desabilitar TODOS os triggers em auth.users temporariamente
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- PASSO 2: Criar usuário admin com hash válido
-- Hash bcrypt para "Admin@2024!" gerado via bcryptjs
DO $$
DECLARE
  v_email    TEXT := 'admin@votacaogastronomica.com';
  -- Hash bcrypt VÁLIDO da senha "Admin@2024!"
  v_hash     TEXT := '$2b$10$kTUiUonxVx9J3L7.ZVmvnecBaq2JBmrHRGnQ/tRzU4AuSmfPIaL6u';
  v_name     TEXT := 'Administrador';
  v_user_id  UUID;
BEGIN
  -- Remove usuário existente
  DELETE FROM auth.users WHERE email = v_email;
  
  -- Gera novo UUID
  v_user_id := gen_random_uuid();
  
  -- Insere usuário com campos mínimos obrigatórios
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
    updated_at
  ) VALUES (
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_hash,
    NOW(),
    '{"role":"admin"}',
    '{"name":"Administrador"}',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Admin criado!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: Admin@2024!';
END $$;

-- PASSO 3: Reabilitar triggers
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- PASSO 4: Verificar
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
