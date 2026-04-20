# Votação Gastronômica

Sistema de votação gastronômica com Next.js 14 + Supabase. Inclui:

- Página pública: lista de pratos, popup com 5 categorias (notas 5–10), cadastro (nome, telefone, e-mail, CPF) e registro de voto. Cada CPF/e-mail vota apenas uma vez.
- Dashboard admin: CRUD de pratos (com imagens), categorias de avaliação, lista de votantes, explorador de votos (público/jurados) e gestão de contas de jurados.
- Dashboard do jurado: avaliação separada dos votos do público, uma avaliação por prato (pode ser atualizada).
- Login unificado para admin e jurado em `/admin/login` com redirecionamento automático por role.
- UI elegante com StyleSeed Toss: paleta gastronômica (bordô/âmbar), Fraunces + Inter, dark mode pronto.

## Stack

- **Next.js 14** (App Router, Server Actions, TypeScript)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Tailwind CSS** + Radix UI primitives
- **Recharts** para gráficos
- **Zod** para validação

## Pré-requisitos

- Node.js 20+
- Um projeto Supabase criado (grátis): https://supabase.com
- Supabase CLI (opcional, para rodar migrations via CLI): https://supabase.com/docs/guides/cli

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

As chaves ficam em **Supabase → Project Settings → API**.

> `SUPABASE_SERVICE_ROLE_KEY` é sensível e deve ficar apenas no servidor. Nunca exponha em código cliente.

### 3. Aplicar migrations ao banco

**Opção A — via Supabase Dashboard (SQL Editor):**
Rode os arquivos em ordem:

1. `supabase/migrations/20260420000001_init_schema.sql`
2. `supabase/migrations/20260420000002_views.sql`
3. `supabase/migrations/20260420000003_rls.sql`
4. `supabase/migrations/20260420000004_storage.sql`
5. `supabase/migrations/20260420000005_seed_defaults.sql` (cria as 5 categorias padrão)

**Opção B — via Supabase CLI:**

```bash
supabase link --project-ref SEU_REF
supabase db push
```

### 4. Criar o primeiro administrador

```bash
npm run seed -- admin@seudominio.com SenhaForte123 "Nome do Admin"
```

O script cria (ou atualiza) um usuário com `role: "admin"` em `raw_app_meta_data`.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:

- `http://localhost:3000` — página pública de votação
- `http://localhost:3000/admin/login` — login admin/jurado (botão também está oculto no rodapé da home)

## Como funciona

### Fluxo público

1. Visitante acessa `/`, vê os pratos ativos.
2. Toca em um prato → abre popup (bottom-sheet no mobile) com 5 categorias.
3. Precisa dar nota **5–10 em todas** as categorias ativas para liberar o botão "Votar".
4. Ao votar, preenche nome, telefone, e-mail e CPF.
5. O sistema valida CPF (dígito verificador) e checa unicidade por CPF e por e-mail. Se duplicado, mostra "Você já votou".
6. IP e User-Agent são registrados **apenas para auditoria** no admin (não bloqueiam).
7. Após votar, um cookie `voted=1` desabilita a interface localmente.

### Fluxo admin

- Botão discreto "Área administrativa" no rodapé da home → `/admin/login`.
- Login único por e-mail/senha. Após autenticar, o sistema lê `app_metadata.role`:
  - `admin` → `/admin/dashboard`
  - `jurado` → `/jurado/dashboard`

### Fluxo jurado

- Ao entrar, vê todos os pratos ativos com status "Pendente" ou "Avaliado".
- Abre um prato, dá notas nas 5 categorias e confirma.
- Pode **atualizar** sua avaliação revisitando o prato.
- Votos de jurados são armazenados separadamente (`voter_type = 'jury'`) e aparecem no ranking como média própria no dashboard admin.

## Modelo de dados

- `dishes` — pratos com nome, descrição, imagem, ordem, ativo.
- `categories` — critérios de avaliação configuráveis pelo admin.
- `voters` — cadastros públicos (CPF e e-mail únicos).
- `votes` — um voto, com `voter_type` (`public` | `jury`). Índices únicos parciais garantem:
  - **Público:** 1 voto por `voter_id` no total.
  - **Jurado:** 1 voto por `(jury_user_id, dish_id)`.
- `vote_scores` — nota 5–10 por categoria vinculada a um voto.
- Views: `v_dish_ranking`, `v_dish_averages`, `v_dish_category_averages` (todas com `security_invoker = true`).

## Segurança

- **RLS habilitado em todas as tabelas expostas.**
- Role armazenada em `raw_app_meta_data` (não em `user_metadata`, que é editável pelo usuário).
- Service role é usado **apenas em Server Actions** para operações privilegiadas (bootstrap de admin, CRUD admin, ingestão de voto público).
- Clientes do navegador usam apenas a chave publishable/anon.
- Middleware protege `/admin/*` (exceto `/admin/login`) e `/jurado/*` por role antes da renderização.
- Storage bucket `dishes` é público para leitura; escrita requer role `admin`.

## Scripts

- `npm run dev` — ambiente de desenvolvimento.
- `npm run build` — build de produção.
- `npm run start` — rodar o build de produção.
- `npm run seed` — criar/atualizar o admin inicial.
- `npm run lint` — rodar ESLint.

## Deploy

Recomendado: **Vercel**. Basta conectar o repositório, definir as mesmas variáveis de ambiente e o middleware + edge runtime funcionam out-of-the-box. Lembre-se de rodar `npm run seed -- admin@email.com SenhaForte123` uma vez para criar o admin em produção (ou criar o admin pelo dashboard do Supabase e adicionar `app_metadata.role = "admin"` manualmente).

## Licença

Privado/cliente.
