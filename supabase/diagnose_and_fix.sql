-- =============================================================================
-- DIAGNÓSTICO E CORREÇÃO: Remover triggers problemáticos em auth.users
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- PASSO 1: Listar TODOS os triggers em auth.users
SELECT 
  trigger_schema,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- PASSO 2: Listar funções que podem estar causando problemas
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_type = 'FUNCTION';

-- PASSO 3: Remover triggers problemáticos (descomente se encontrar algum)
-- DESCOMENTE AS LINHAS ABAIXO SE QUISER REMOVER TRIGGERS ESPECÍFICOS:
-- DROP TRIGGER IF EXISTS nome_do_trigger ON auth.users;

-- PASSO 4: Verificar constraints
SELECT 
  conname,
  contype,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;

-- PASSO 5: Desabilitar TODOS os triggers temporariamente (se necessário)
-- ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- PASSO 6: Criar usuário admin com senha vazia (será atualizada via API)
-- Isso cria o usuário sem passar pela API que está dando erro
DO $$
DECLARE
  v_email    TEXT := 'admin@votacaogastronomica.com';
  v_name     TEXT := 'Administrador';
  v_user_id  UUID := gen_random_uuid();
BEGIN
  -- Remove usuário existente
  DELETE FROM auth.users WHERE email = v_email;
  
  -- Insere usuário com senha temporária inválida (precisará resetar)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,  -- hash inválido temporário
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_sent_at
  ) VALUES (
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    '$2a$10$invalid_temp_hash',  -- hash temporário inválido
    NOW(),
    '{"role":"admin"}',
    '{"name":"Administrador"}',
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Admin criado!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE '⚠️  ATENÇÃO: Execute agora o script seed.ts para definir a senha:';
  RAISE NOTICE '   npm run seed -- admin@votacaogastronomica.com SUA_SENHA "Administrador"';
END $$;

-- PASSO 7: Reabilitar triggers (se desabilitou)
-- ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- PASSO 8: Verificar
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
