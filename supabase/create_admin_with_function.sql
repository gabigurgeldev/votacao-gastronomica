-- =============================================================================
-- CRIAR ADMIN USANDO FUNÇÃO COM SECURITY DEFINER
-- Pode ter mais permissões que o usuário comum
-- =============================================================================

-- PASSO 1: Criar função que vai criar o usuário
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_email TEXT,
  p_password_hash TEXT,  -- hash bcrypt
  p_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- Executa com permissões do dono da função
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_instance_id UUID;
BEGIN
  -- Pegar instance_id existente
  SELECT instance_id INTO v_instance_id 
  FROM auth.users LIMIT 1;
  
  -- Se não houver instance_id, usa NULL
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Remover usuário existente
  DELETE FROM auth.users WHERE email = p_email;
  
  -- Inserir novo usuário
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
    v_instance_id,
    'authenticated',
    'authenticated',
    p_email,
    p_password_hash,
    NOW(),
    jsonb_build_object('role', 'admin'),
    jsonb_build_object('name', p_name),
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
  
  RETURN v_user_id;
END;
$$;

-- Dar permissão para executar a função
GRANT EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT, TEXT) TO authenticated, anon, postgres;

-- PASSO 2: Chamar a função para criar o admin
-- Hash bcrypt da senha "Admin@2024!"
SELECT public.create_admin_user(
  'admin@votacaogastronomica.com',
  '$2b$10$kTUiUonxVx9J3L7.ZVmvnecBaq2JBmrHRGnQ/tRzU4AuSmfPIaL6u',
  'Administrador'
);

-- PASSO 3: Verificar se foi criado
SELECT 
  id,
  email,
  raw_app_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users 
WHERE email = 'admin@votacaogastronomica.com';
