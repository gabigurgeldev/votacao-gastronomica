/**
 * Script com diagnóstico detalhado para criar admin
 * Mostra exatamente qual erro está acontecendo
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const EMAIL = process.argv[2] || 'admin@votacaogastronomica.com';
const PASSWORD = process.argv[3] || 'Admin@2024!';
const NAME = process.argv[4] || 'Administrador';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('CONFIGURAÇÃO:');
console.log('  URL:', SUPABASE_URL ? 'OK' : 'FALTANDO');
console.log('  KEY:', SERVICE_KEY ? 'OK (oculto)' : 'FALTANDO');
console.log('  Email:', EMAIL);
console.log('========================================\n');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO:\n');

  // 1. Testar conexão básica
  console.log('1. Testando conexão...');
  try {
    const { data: health, error: healthError } = await admin.from('dishes').select('count', { count: 'exact', head: true });
    if (healthError) {
      console.log('   ⚠️  Aviso: ', healthError.message);
    } else {
      console.log('   ✅ Conexão OK');
    }
  } catch (e) {
    console.log('   ⚠️  Erro conexão:', e.message);
  }

  // 2. Listar usuários existentes
  console.log('\n2. Verificando usuários existentes...');
  try {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 10 });
    if (listError) {
      console.log('   ❌ Erro ao listar:', listError.message);
    } else {
      console.log('   ✅ Total de usuários:', listData.users.length);
      const existing = listData.users.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());
      if (existing) {
        console.log('   📝 Usuário já existe:', existing.id);
        console.log('   📝 Role atual:', existing.app_metadata?.role);
      } else {
        console.log('   📝 Usuário não existe (será criado)');
      }
    }
  } catch (e) {
    console.log('   ❌ Erro:', e.message);
  }

  // 3. Tentar criar usuário
  console.log('\n3. Tentando criar usuário...');
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: { name: NAME },
    });

    if (error) {
      console.log('   ❌ ERRO AO CRIAR:');
      console.log('      Mensagem:', error.message);
      console.log('      Código:', error.code || 'N/A');
      console.log('      Status:', error.status || 'N/A');
      
      // Tentar obter mais detalhes
      if (error.message.includes('Database error')) {
        console.log('\n   💡 DICA: Este erro geralmente significa que há um trigger ou constraint');
        console.log('      no banco de dados impedindo a criação.');
        console.log('      Verifique no Supabase Dashboard → Database → Triggers');
      }
    } else {
      console.log('   ✅ USUÁRIO CRIADO COM SUCESSO!');
      console.log('      ID:', data.user?.id);
      console.log('      Email:', data.user?.email);
      console.log('\n   📧 Faça login em: http://localhost:3002/admin/login');
      console.log('      Email:', EMAIL);
      console.log('      Senha:', PASSWORD);
    }
  } catch (e) {
    console.log('   ❌ Erro inesperado:', e.message);
    console.log('   Stack:', e.stack);
  }
}

diagnose();
