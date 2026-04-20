-- =============================================================================
-- Votação Gastronômica — Schema inicial
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- Helpers: role do usuário autenticado (lido de app_metadata, seguro para RLS)
-- =============================================================================
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  );
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated, anon;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.is_jury()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'jurado';
$$;

-- =============================================================================
-- Tabela: dishes
-- =============================================================================
create table if not exists public.dishes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  image_url     text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_dishes_active_order
  on public.dishes (active, display_order);

-- =============================================================================
-- Tabela: categories (configuráveis pelo admin)
-- =============================================================================
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_categories_active_order
  on public.categories (active, display_order);

-- =============================================================================
-- Tabela: voters (público — sem senha)
-- =============================================================================
create table if not exists public.voters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  email       text not null,
  cpf         text not null,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  constraint voters_email_unique unique (email),
  constraint voters_cpf_unique   unique (cpf)
);

create index if not exists idx_voters_created_at on public.voters (created_at desc);

-- =============================================================================
-- Tabela: votes
-- =============================================================================
create type public.voter_kind as enum ('public', 'jury');

create table if not exists public.votes (
  id            uuid primary key default gen_random_uuid(),
  voter_type    public.voter_kind not null,
  voter_id      uuid references public.voters(id) on delete cascade,
  jury_user_id  uuid references auth.users(id) on delete cascade,
  dish_id       uuid not null references public.dishes(id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint votes_voter_consistency check (
    (voter_type = 'public' and voter_id is not null and jury_user_id is null)
    or
    (voter_type = 'jury'   and jury_user_id is not null and voter_id is null)
  )
);

-- 1 voto por votante público TOTAL (pode votar apenas em um prato)
create unique index if not exists uq_votes_public_one_per_voter
  on public.votes (voter_id)
  where voter_type = 'public';

-- 1 conjunto de notas por prato por jurado
create unique index if not exists uq_votes_jury_per_dish
  on public.votes (jury_user_id, dish_id)
  where voter_type = 'jury';

create index if not exists idx_votes_dish on public.votes (dish_id);
create index if not exists idx_votes_created on public.votes (created_at desc);

-- =============================================================================
-- Tabela: vote_scores (uma linha por categoria em cada voto)
-- =============================================================================
create table if not exists public.vote_scores (
  id           uuid primary key default gen_random_uuid(),
  vote_id      uuid not null references public.votes(id) on delete cascade,
  category_id  uuid not null references public.categories(id) on delete restrict,
  score        smallint not null check (score between 5 and 10),
  created_at   timestamptz not null default now(),
  constraint vote_scores_unique_per_vote_category unique (vote_id, category_id)
);

create index if not exists idx_vote_scores_vote on public.vote_scores (vote_id);
create index if not exists idx_vote_scores_category on public.vote_scores (category_id);

-- =============================================================================
-- Trigger: updated_at
-- =============================================================================
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dishes_set_updated_at on public.dishes;
create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function public.tg_set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.tg_set_updated_at();
