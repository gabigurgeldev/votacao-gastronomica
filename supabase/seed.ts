/**
 * Bootstrap do primeiro admin.
 *
 * Uso:
 *   1. Configure as variáveis no .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL
 *        SUPABASE_SERVICE_ROLE_KEY
 *   2. Rode passando email e senha como argumentos:
 *        npm run seed -- admin@exemplo.com SenhaSegura123 "Nome do Admin"
 *
 * O script cria (ou atualiza) um usuário com role `admin` em `raw_app_meta_data`.
 * Nunca use `user_metadata` para autorização (pode ser editado pelo próprio usuário).
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Pegar email, senha e nome dos argumentos da linha de comando
const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const NAME = process.argv[4] ?? "Administrador";

function fail(msg: string): never {
  console.error(`[seed] ${msg}`);
  process.exit(1);
}

function showUsage(): never {
  console.log(`
Uso: npm run seed -- <email> <senha> [nome]

Exemplo:
  npm run seed -- admin@exemplo.com SenhaSegura123 "Administrador"
`);
  process.exit(1);
}

if (!EMAIL || !PASSWORD || EMAIL.startsWith("-")) {
  showUsage();
}

if (!SUPABASE_URL) fail("NEXT_PUBLIC_SUPABASE_URL ausente no .env.local");
if (!SERVICE_KEY) fail("SUPABASE_SERVICE_ROLE_KEY ausente no .env.local");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (existing.error) fail(`Falha ao listar usuários: ${existing.error.message}`);

  const found = existing.data.users.find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase(),
  );

  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password: PASSWORD,
      app_metadata: { ...found.app_metadata, role: "admin" },
      user_metadata: { ...found.user_metadata, name: NAME },
      email_confirm: true,
    });
    if (error) fail(`Falha ao atualizar admin existente: ${error.message}`);
    console.log(`[seed] Admin atualizado: ${EMAIL}`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { name: NAME },
  });
  if (error) fail(`Falha ao criar admin: ${error.message}`);
  console.log(`[seed] Admin criado: ${data.user?.email}`);
}

run().catch((e) => fail(String(e)));
