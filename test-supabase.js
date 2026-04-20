// Script rápido para testar conexão com Supabase
// Rode: node test-supabase.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testConnection() {
  console.log("🔍 Testando conexão com Supabase...\n");
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Variáveis de ambiente não configuradas!");
    console.log("Verifique se o .env.local está configurado corretamente.");
    process.exit(1);
  }
  
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`ANON_KEY: ${SUPABASE_ANON_KEY.slice(0, 20)}...\n`);
  
  try {
    // Testa endpoint REST básico
    const response = await fetch(`${SUPABASE_URL}/rest/v1/dishes?select=id&limit=1`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (response.ok) {
      console.log("✅ Conexão OK!");
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log(`Resposta: ${JSON.stringify(data)}`);
    } else {
      console.error(`❌ Erro ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error(`Detalhes: ${text}`);
    }
  } catch (err) {
    console.error("❌ Erro de conexão:");
    console.error(err.message);
    console.log("\nPossíveis causas:");
    console.log("- Projeto Supabase foi pausado (free tier pausa após 7 dias sem atividade)");
    console.log("- URL ou chave incorretas");
    console.log("- Problema de rede");
  }
}

testConnection();
