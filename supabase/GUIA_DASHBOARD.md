# Guia: Criar Usuário Admin pelo Dashboard do Supabase

## Método 1: Via Dashboard (Recomendado - Sem erros de permissão)

### Passo a passo:

1. **Acesse seu projeto no Supabase Dashboard**
   - URL: https://app.supabase.com
   - Faça login com sua conta

2. **Navegue até Authentication**
   - No menu lateral, clique em **"Authentication"**
   - Depois clique na aba **"Users"**

3. **Adicionar novo usuário**
   - Clique no botão **"Add user"** (canto superior direito)
   - Selecione **"Create new user"**

4. **Preencha os dados:**
   - **Email:** `admin@votacaogastronomica.com`
   - **Password:** `Admin@2024!` (ou sua senha desejada)
   - ✅ Marque **"Auto-confirm email"** (ou confirme depois)
   - Clique em **"Create user"**

5. **Definir o role como admin**
   - Na lista de usuários, clique no usuário recém-criado
   - Role desça até **"App metadata"** (raw_app_meta_data)
   - Clique em **"Edit"**
   - Adicione: `{"role": "admin"}`
   - Salve

6. **Definir o nome**
   - Em **"User metadata"** (raw_user_meta_data)
   - Adicione: `{"name": "Administrador"}`
   - Salve

7. **Pronto!** 
   - Acesse: http://localhost:3002/admin/login
   - Faça login com o email e senha

---

## Método 2: Via Terminal (se o erro for resolvido)

```bash
npm run seed -- admin@votacaogastronomica.com Admin@2024! "Administrador"
```

---

## Solução de problemas

### Se o usuário já existe mas sem role admin:

1. No Dashboard, encontre o usuário
2. Clique nele para abrir os detalhes
3. Vá em **"App metadata"**
4. Clique em **"Edit"**
5. Adicione/modifique para: `{"role": "admin"}`
6. Salve

### Se não conseguir fazer login:

1. Verifique se o email está confirmado (email_confirmed_at não é null)
2. Verifique se o App metadata tem: `{"role": "admin"}`
3. Tente resetar a senha pelo Dashboard

---

## Credenciais padrão:

- **Email:** admin@votacaogastronomica.com
- **Senha:** Admin@2024!
- **Role:** admin
