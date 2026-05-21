-- =============================================================================
-- White-Label + Nichos/Empresas — Refatoração completa
-- Substitui modelo antigo (dishes + categories + vote_scores) por
-- niches + companies + votes (voto único por nicho/usuário) + site_settings
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- 0. Helpers (idempotentes — re-cria caso migrations antigas tenham sumido)
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
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_profile_role text;
begin
  v_role := public.current_user_role();
  if v_role = 'admin' then
    return true;
  end if;

  -- Fallback: checa tabela profiles (caso role esteja só lá)
  begin
    select role into v_profile_role
    from public.profiles
    where id = auth.uid();
    return coalesce(v_profile_role = 'admin', false);
  exception when undefined_table then
    return false;
  end;
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- =============================================================================
-- 1. DROP do schema antigo (em ordem reversa de dependência)
-- =============================================================================
drop view  if exists public.v_dish_ranking_by_type cascade;
drop view  if exists public.v_dish_category_detailed cascade;
drop view  if exists public.v_votes_by_type cascade;
drop view  if exists public.v_dish_ranking cascade;
drop view  if exists public.v_dish_category_averages cascade;
drop view  if exists public.v_dish_averages cascade;

drop table if exists public.vote_scores cascade;
drop table if exists public.votes cascade;
drop table if exists public.voters cascade;
drop table if exists public.dishes cascade;
drop table if exists public.categories cascade;

drop type  if exists public.voter_kind cascade;

-- Bucket antigo 'dishes' não removido aqui (Supabase bloqueia DELETE direto em
-- storage.buckets via SQL). Remover manualmente pelo Dashboard se quiser.
-- Remove objetos órfãos do bucket antigo (não falha se bucket inexistir):
do $$
begin
  delete from storage.objects where bucket_id = 'dishes';
exception when others then null;
end $$;

-- =============================================================================
-- 2. Atualizar tabela profiles para aceitar role 'voter'
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
exception when others then null;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles') then
    execute 'alter table public.profiles add constraint profiles_role_check check (role in (''admin'', ''jurado'', ''voter''))';
  end if;
end $$;

-- =============================================================================
-- 3. Tabela: niches
-- =============================================================================
create table if not exists public.niches (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  icon          text,
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_niches_active_order
  on public.niches (active, display_order);

drop trigger if exists niches_set_updated_at on public.niches;
create trigger niches_set_updated_at
  before update on public.niches
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- 4. Tabela: companies
-- =============================================================================
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  niche_id      uuid not null references public.niches(id) on delete cascade,
  name          text not null,
  logo_url      text,
  display_order int  not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_companies_niche
  on public.companies (niche_id, active, display_order);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- 5. Tabela: votes (1 voto por usuário por nicho)
-- =============================================================================
create table if not exists public.votes (
  id             uuid primary key default gen_random_uuid(),
  voter_user_id  uuid not null references auth.users(id) on delete cascade,
  niche_id       uuid not null references public.niches(id) on delete cascade,
  company_id     uuid not null references public.companies(id) on delete cascade,
  created_at     timestamptz not null default now(),
  constraint votes_unique_per_voter_niche unique (voter_user_id, niche_id)
);

create index if not exists idx_votes_company  on public.votes (company_id);
create index if not exists idx_votes_niche    on public.votes (niche_id);
create index if not exists idx_votes_voter    on public.votes (voter_user_id);

-- =============================================================================
-- 6. Tabela: site_settings (singleton id=1)
-- =============================================================================
create table if not exists public.site_settings (
  id                 int primary key default 1,
  -- Cores (formato HSL string, ex: "345 62% 30%")
  brand_hsl          text not null default '345 62% 30%',
  brand_fg_hsl       text not null default '36 35% 98%',
  accent_hsl         text not null default '32 92% 52%',
  accent_fg_hsl      text not null default '24 14% 12%',
  background_hsl     text not null default '36 35% 98%',
  foreground_hsl     text not null default '24 14% 12%',
  muted_hsl          text not null default '30 24% 93%',
  border_hsl         text not null default '28 20% 87%',
  -- Textos
  site_name          text not null default 'Votação',
  headline           text not null default 'Vote nas melhores empresas da noite.',
  subheadline        text not null default 'Escolha sua empresa favorita em cada nicho.',
  footer_text        text not null default 'Todos os direitos reservados',
  -- Logos
  logo_site_url      text,
  logo_event_url     text,
  favicon_url        text,
  logo_footer_url    text,
  updated_at         timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.tg_set_updated_at();

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- =============================================================================
-- 7. View de resultados
-- =============================================================================
create or replace view public.v_niche_company_results
with (security_invoker = true) as
select
  n.id                          as niche_id,
  n.name                        as niche_name,
  c.id                          as company_id,
  c.name                        as company_name,
  c.logo_url                    as logo_url,
  count(v.id)                   as total_votes
from public.niches n
left join public.companies c on c.niche_id = n.id
left join public.votes     v on v.company_id = c.id
group by n.id, n.name, c.id, c.name, c.logo_url;

-- =============================================================================
-- 8. RLS
-- =============================================================================
alter table public.niches        enable row level security;
alter table public.companies     enable row level security;
alter table public.votes         enable row level security;
alter table public.site_settings enable row level security;

-- niches: SELECT público (ativos); CRUD admin
drop policy if exists "niches_select_active_public" on public.niches;
create policy "niches_select_active_public" on public.niches
  for select to anon, authenticated
  using (active = true or public.is_admin());

drop policy if exists "niches_admin_all" on public.niches;
create policy "niches_admin_all" on public.niches
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- companies: SELECT público (ativas); CRUD admin
drop policy if exists "companies_select_active_public" on public.companies;
create policy "companies_select_active_public" on public.companies
  for select to anon, authenticated
  using (active = true or public.is_admin());

drop policy if exists "companies_admin_all" on public.companies;
create policy "companies_admin_all" on public.companies
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- votes: usuário autenticado insere/seleciona o seu; admin vê tudo
drop policy if exists "votes_select_own" on public.votes;
create policy "votes_select_own" on public.votes
  for select to authenticated
  using (voter_user_id = auth.uid());

drop policy if exists "votes_select_admin" on public.votes;
create policy "votes_select_admin" on public.votes
  for select to authenticated
  using (public.is_admin());

drop policy if exists "votes_insert_own" on public.votes;
create policy "votes_insert_own" on public.votes
  for insert to authenticated
  with check (voter_user_id = auth.uid());

-- site_settings: SELECT público (qualquer um lê o tema); UPDATE admin
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "site_settings_update_admin" on public.site_settings;
create policy "site_settings_update_admin" on public.site_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 9. Storage buckets
-- =============================================================================
insert into storage.buckets (id, name, public)
values
  ('companies', 'companies', true),
  ('branding',  'branding',  true)
on conflict (id) do nothing;

-- Leitura pública dos dois buckets
drop policy if exists "companies_public_read" on storage.objects;
create policy "companies_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'companies');

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'branding');

-- Admin escreve em companies
drop policy if exists "companies_admin_insert" on storage.objects;
create policy "companies_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'companies' and public.is_admin());

drop policy if exists "companies_admin_update" on storage.objects;
create policy "companies_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'companies' and public.is_admin())
  with check (bucket_id = 'companies' and public.is_admin());

drop policy if exists "companies_admin_delete" on storage.objects;
create policy "companies_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'companies' and public.is_admin());

-- Admin escreve em branding
drop policy if exists "branding_admin_insert" on storage.objects;
create policy "branding_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and public.is_admin());

drop policy if exists "branding_admin_update" on storage.objects;
create policy "branding_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and public.is_admin())
  with check (bucket_id = 'branding' and public.is_admin());

drop policy if exists "branding_admin_delete" on storage.objects;
create policy "branding_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and public.is_admin());

-- =============================================================================
-- 10. Habilitar Realtime na publication
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.site_settings;
  exception when duplicate_object then null;
  end;
end $$;

-- Garantir que o payload da realtime traga todos os campos da row
alter table public.site_settings replica identity full;

-- =============================================================================
-- 11. Permitir trigger de sincronia profiles aceitar role voter por default
--     (cadastros de voter via signUp setarão raw_app_meta_data.role='voter' OU
--      o profile cai no default 'jurado' — atualizamos default p/ 'voter')
-- =============================================================================
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='role') then
    alter table public.profiles alter column role set default 'voter';
  end if;
end $$;

-- =============================================================================
-- 12. Seed: nichos de exemplo (opcional, admin pode editar)
-- =============================================================================
insert into public.niches (name, description, display_order, active)
values
  ('Hamburgueria', 'Os melhores hamburgueres da região.',  1, true),
  ('Pizzaria',     'As pizzarias mais saborosas.',         2, true),
  ('Doceria',      'Sobremesas e confeitarias.',           3, true)
on conflict do nothing;
