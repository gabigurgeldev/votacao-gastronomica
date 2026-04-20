/**
 * Script para criar usuário admin com senha em texto plano
 * Usa bcrypt para gerar o hash e insere diretamente no banco
 *
 * Uso:
 *   node supabase/create-admin.js
 *
 * Configure as variáveis abaixo:
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// ============== CONFIGURAÇÃO ==============
const EMAIL = 'admin@votacaogastronomica.com';
const PASSWORD = 'Admin@2024!';
const NAME = 'Administrador';
// ==========================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Erro: Configure as variáveis no .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nValores atuais:');
  console.error('   URL:', SUPABASE_URL || 'NÃO DEFINIDO');
  console.error('   KEY:', SERVICE_KEY ? 'DEFINIDO (oculto)' : 'NÃO DEFINIDO');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdmin() {
  try {
    // Verifica se usuário existe
    const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const found = existing.users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());
    
    if (found) {
      console.log('📝 Usuário já existe, atualizando...');
      const { error } = await admin.auth.admin.updateUserById(found.id, {
        password: PASSWORD,
        app_metadata: { role: 'admin' },
        user_metadata: { name: NAME },
        email_confirm: true,
      });
      
      if (error) {
        console.error('❌ Erro ao atualizar:', error.message);
        return;
      }
      
      console.log('✅ Admin atualizado com sucesso!');
    } else {
      console.log('📝 Criando novo usuário admin...');
      const { data, error } = await admin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        app_metadata: { role: 'admin' },
        user_metadata: { name: NAME },
      });
      
      if (error) {
        console.error('❌ Erro ao criar:', error.message);
        console.error('Detalhes:', error);
        return;
      }
      
      console.log('✅ Admin criado com sucesso!');
      console.log('   ID:', data.user?.id);
    }
    
    console.log('\n📧 Email:', EMAIL);
    console.log('🔑 Senha:', PASSWORD);
    console.log('\n👉 Faça login em: http://localhost:3002/admin/login');
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    console.error(err);
  }
}

createAdmin();
