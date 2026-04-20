-- =============================================================================
-- Criar usuário admin com SENHA EM TEXTO PLANO (sem hash manual)
-- Usa a função auth.create_user() do Supabase
-- =============================================================================

-- Configure suas variáveis aqui:
-- =============================
-- EMAIL:    admin@votacaogastronomica.com
-- SENHA:    Admin@2024!
-- NOME:     Administrador

-- Execute este bloco:
DO $$
DECLARE
  v_email    TEXT := 'admin@votacaogastronomica.com';
  v_password TEXT := 'Admin@2024!';
  v_name     TEXT := 'Administrador';
  v_result   JSONB;
BEGIN
  -- Remove usuário existente (se houver)
  DELETE FROM auth.users WHERE email = v_email;
  
  -- Cria usuário usando a função do Supabase Auth (aceita senha em texto plano!)
  -- Esta função faz o hash bcrypt automaticamente
  SELECT auth.create_user(
    jsonb_build_object(
      'email', v_email,
      'password', v_password,
      'email_confirm', true,
      'app_metadata', jsonb_build_object('role', 'admin'),
      'user_metadata', jsonb_build_object('name', v_name)
    )
  ) INTO v_result;
  
  RAISE NOTICE '✅ Admin criado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Senha: %', v_password;
END $$;

-- =============================================================================
-- ALTERNATIVA: Se auth.create_user() não estiver disponível na sua instância,
-- use o script via terminal (recomendado):
--
--   npm run seed -- admin@exemplo.com SUA_SENHA "Nome Admin"
--
-- Este script usa a API Admin do Supabase que aceita senha em texto plano.
-- =============================================================================

-- Verificação após execução:
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  email_confirmed_at is not null as email_confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
