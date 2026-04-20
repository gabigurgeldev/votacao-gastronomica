-- =============================================================================
-- BRUTEFORCE: Remover tudo que pode estar impedindo e criar usuário
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- PASSO 1: Dropar tabela user_profiles se existir (ignora erro se nao existir)
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- PASSO 2: Remover TODOS triggers de auth.users
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass 
      AND NOT tgisinternal -- não remover triggers internos do postgres
  LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
      RAISE NOTICE 'Removido: %', r.tgname;
    EXCEPTION WHEN insufficient_privilege OR undefined_object THEN
      RAISE NOTICE 'Nao foi possivel remover: %', r.tgname;
    END;
  END LOOP;
END $$;

-- PASSO 3: Remover funções que podem estar causando problemas
DROP FUNCTION IF EXISTS public.tg_sync_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASSO 4: Inserir usuário admin com dados mínimos
DO $$
DECLARE
  v_email TEXT := 'admin@votacaogastronomica.com';
  v_hash  TEXT := '$2b$10$kTUiUonxVx9J3L7.ZVmvnecBaq2JBmrHRGnQ/tRzU4AuSmfPIaL6u'; -- Admin@2024!
  v_id    UUID := gen_random_uuid();
BEGIN
  -- Delete existente
  DELETE FROM auth.users WHERE email = v_email;
  
  -- Insert mínimo
  INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, created_at, updated_at)
  VALUES (v_id, 'authenticated', 'authenticated', v_email, v_hash, NOW(), '{"role":"admin"}', NOW(), NOW());
  
  -- Atualizar metadata separadamente
  UPDATE auth.users 
  SET raw_user_meta_data = '{"name":"Administrador"}'
  WHERE id = v_id;
  
  RAISE NOTICE '✅ Admin criado: %', v_email;
END $$;

-- PASSO 5: Verificar
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
