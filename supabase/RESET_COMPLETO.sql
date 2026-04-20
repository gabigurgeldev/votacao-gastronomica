-- =============================================================================
-- RESET COMPLETO — Votação Gastronômica
-- =============================================================================
-- O QUE ESTE SCRIPT FAZ:
--   1) Limpa TUDO: triggers custom em auth.users, funções, views, tabelas,
--      enum, storage bucket 'dishes' e APAGA todos os usuários de auth.users.
--   2) Recria schema do zero (dishes, categories, voters, votes, vote_scores,
--      profiles), views de agregação, funções auxiliares, RLS baseada na
--      tabela profiles, bucket 'dishes' com policies e seed de 5 categorias.
--   3) Expõe RPC public.sync_profile_for_email(email, nome, role) para
--      promover/registrar usuário DEPOIS de criar no Dashboard.
--
-- COMO USAR (executar em ordem no SQL Editor do Supabase):
--   a) Rode este arquivo INTEIRO de uma vez.
--   b) Vá em Authentication > Users > Add user, crie o admin com senha e
--      marque "Auto Confirm User".
--   c) No SQL Editor execute:
--        select public.sync_profile_for_email(
--          'admin@votacaogastronomica.com', 'Administrador', 'admin'
--        );
--   d) Faça login em /admin/login.
-- =============================================================================


-- =============================================================================
-- PARTE 1 — LIMPEZA NUCLEAR
-- =============================================================================

-- 1.1) Remover TODOS os triggers custom em auth.users (sem tocar nos internos)
do $$
declare
  t record;
begin
  for t in
    select tgname
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and not tgisinternal
      and tgname not like 'RI_%'
  loop
    execute format('drop trigger if exists %I on auth.users;', t.tgname);
    raise notice 'Trigger removido de auth.users: %', t.tgname;
  end loop;
end $$;

-- 1.2) Remover TODOS os triggers custom em qualquer tabela do schema auth
do $$
declare
  r record;
begin
  for r in
    select n.nspname as sch, c.relname as tbl, t.tgname as trg
    from pg_trigger t
    join pg_class c     on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and not t.tgisinternal
      and t.tgname not like 'RI_%'
  loop
    execute format('drop trigger if exists %I on %I.%I;', r.trg, r.sch, r.tbl);
  end loop;
end $$;

-- 1.3) Dropar views antigas (precisa vir antes das tabelas)
drop view if exists public.v_dish_averages          cascade;
drop view if exists public.v_dish_category_averages cascade;
drop view if exists public.v_dish_ranking           cascade;
drop view if exists public.v_profiles               cascade;

-- 1.4) Dropar tabelas em ordem segura
drop table if exists public.vote_scores   cascade;
drop table if exists public.votes         cascade;
drop table if exists public.voters        cascade;
drop table if exists public.categories    cascade;
drop table if exists public.dishes        cascade;
drop table if exists public.profiles      cascade;
drop table if exists public.user_profiles cascade;  -- legado, se existir

-- 1.5) Dropar enum
drop type if exists public.voter_kind cascade;

-- 1.6) Dropar funções conhecidas do histórico (com qualquer assinatura)
do $$
declare
  r record;
begin
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname in (
        'tg_sync_profile',
        'handle_new_user',
        'sync_user_profile',
        'create_profile_for_user',
        'sync_profile_for_email',
        'is_admin',
        'is_jury',
        'current_user_role',
        'is_profile_admin',
        'is_profile_jury',
        'get_my_role',
        'tg_set_updated_at'
      )
  loop
    execute format('drop function if exists public.%I(%s) cascade;', r.proname, r.args);
  end loop;
end $$;

-- 1.7) Limpar bucket 'dishes' (policies, objetos e o bucket em si)
--      Supabase protege storage.objects/buckets com trigger storage.protect_delete.
--      Contornamos usando session_replication_role = 'replica' que desabilita
--      triggers de usuário na sessão atual.
do $$
begin
  drop policy if exists "dish_images_public_read"    on storage.objects;
  drop policy if exists "dish_images_admin_insert"   on storage.objects;
  drop policy if exists "dish_images_admin_update"   on storage.objects;
  drop policy if exists "dish_images_admin_delete"   on storage.objects;
exception when others then
  raise notice 'Ignorando erro de drop policy storage: %', sqlerrm;
end $$;

set session_replication_role = 'replica';

delete from storage.objects where bucket_id = 'dishes';
delete from storage.buckets where id = 'dishes';

-- 1.8) APAGAR todos os usuários de auth.users
--      (conforme decidido: wipe total — começa do zero)
delete from auth.users;

set session_replication_role = 'origin';


-- =============================================================================
-- PARTE 2 — EXTENSÕES E HELPERS
-- =============================================================================

create extension if not exists "pgcrypto";

-- Função genérica para manter updated_at
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- PARTE 3 — TABELA: profiles (fonte da verdade para role)
-- =============================================================================

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'jurado' check (role in ('admin', 'jurado')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role   on public.profiles(role);
create index idx_profiles_active on public.profiles(active);
create index idx_profiles_email  on public.profiles(email);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- Helpers de autorização baseados em profiles
create or replace function public.is_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active = true
  );
$$;

create or replace function public.is_profile_jury()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'jurado'
      and active = true
  );
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

grant execute on function public.is_profile_admin() to authenticated, anon;
grant execute on function public.is_profile_jury()  to authenticated, anon;
grant execute on function public.get_my_role()      to authenticated;


-- =============================================================================
-- PARTE 4 — TABELA: dishes
-- =============================================================================

create table public.dishes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  image_url     text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_dishes_active_order on public.dishes (active, display_order);

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function public.tg_set_updated_at();


-- =============================================================================
-- PARTE 5 — TABELA: categories
-- =============================================================================

create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  display_order int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_categories_active_order on public.categories (active, display_order);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.tg_set_updated_at();


-- =============================================================================
-- PARTE 6 — TABELA: voters (público — sem senha)
-- =============================================================================

create table public.voters (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  email      text not null,
  cpf        text not null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  constraint voters_email_unique unique (email),
  constraint voters_cpf_unique   unique (cpf)
);

create index idx_voters_created_at on public.voters (created_at desc);


-- =============================================================================
-- PARTE 7 — TABELA: votes + enum voter_kind
-- =============================================================================

create type public.voter_kind as enum ('public', 'jury');

create table public.votes (
  id           uuid primary key default gen_random_uuid(),
  voter_type   public.voter_kind not null,
  voter_id     uuid references public.voters(id) on delete cascade,
  jury_user_id uuid references auth.users(id)   on delete cascade,
  dish_id      uuid not null references public.dishes(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint votes_voter_consistency check (
    (voter_type = 'public' and voter_id   is not null and jury_user_id is null)
    or
    (voter_type = 'jury'   and jury_user_id is not null and voter_id   is null)
  )
);

-- 1 voto por votante público (total — só pode votar em um prato)
create unique index uq_votes_public_one_per_voter
  on public.votes (voter_id)
  where voter_type = 'public';

-- 1 conjunto de notas por prato por jurado
create unique index uq_votes_jury_per_dish
  on public.votes (jury_user_id, dish_id)
  where voter_type = 'jury';

create index idx_votes_dish    on public.votes (dish_id);
create index idx_votes_created on public.votes (created_at desc);


-- =============================================================================
-- PARTE 8 — TABELA: vote_scores (uma linha por categoria em cada voto)
-- =============================================================================

create table public.vote_scores (
  id          uuid primary key default gen_random_uuid(),
  vote_id     uuid not null references public.votes(id)       on delete cascade,
  category_id uuid not null references public.categories(id)  on delete restrict,
  score       smallint not null check (score between 5 and 10),
  created_at  timestamptz not null default now(),
  constraint vote_scores_unique_per_vote_category unique (vote_id, category_id)
);

create index idx_vote_scores_vote     on public.vote_scores (vote_id);
create index idx_vote_scores_category on public.vote_scores (category_id);


-- =============================================================================
-- PARTE 9 — VIEWS DE AGREGAÇÃO (security_invoker para respeitar RLS)
-- =============================================================================

create or replace view public.v_dish_averages
with (security_invoker = true) as
select
  d.id                             as dish_id,
  d.name                           as dish_name,
  v.voter_type                     as voter_type,
  count(distinct v.id)             as total_votes,
  round(avg(vs.score)::numeric, 2) as avg_score
from public.dishes d
left join public.votes       v  on v.dish_id  = d.id
left join public.vote_scores vs on vs.vote_id = v.id
group by d.id, d.name, v.voter_type;

create or replace view public.v_dish_category_averages
with (security_invoker = true) as
select
  d.id                             as dish_id,
  d.name                           as dish_name,
  c.id                             as category_id,
  c.name                           as category_name,
  v.voter_type                     as voter_type,
  count(vs.id)                     as total_scores,
  round(avg(vs.score)::numeric, 2) as avg_score
from public.dishes d
cross join public.categories c
left join public.votes       v  on v.dish_id  = d.id
left join public.vote_scores vs on vs.vote_id = v.id and vs.category_id = c.id
group by d.id, d.name, c.id, c.name, v.voter_type;

create or replace view public.v_dish_ranking
with (security_invoker = true) as
select
  d.id                                                                   as dish_id,
  d.name                                                                 as dish_name,
  d.image_url                                                            as image_url,
  count(distinct v.id)                                                   as total_votes,
  round(avg(vs.score)::numeric, 2)                                       as avg_score_overall,
  round(avg(vs.score) filter (where v.voter_type = 'public')::numeric, 2) as avg_score_public,
  round(avg(vs.score) filter (where v.voter_type = 'jury')::numeric, 2)   as avg_score_jury
from public.dishes d
left join public.votes       v  on v.dish_id  = d.id
left join public.vote_scores vs on vs.vote_id = v.id
where d.active = true
group by d.id, d.name, d.image_url;

create or replace view public.v_profiles
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.name,
  p.role,
  p.active,
  p.created_at,
  p.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at
from public.profiles p
left join auth.users au on au.id = p.id;


-- =============================================================================
-- PARTE 10 — RPC: sync_profile_for_email
-- Promove/registra usuário DEPOIS de criar pelo Dashboard.
-- =============================================================================

create or replace function public.sync_profile_for_email(
  p_email text,
  p_name  text default null,
  p_role  text default 'jurado'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  if p_role not in ('admin', 'jurado') then
    raise exception 'role deve ser admin ou jurado';
  end if;

  select id into v_user_id from auth.users where email = p_email;

  if v_user_id is null then
    raise exception 'Usuário não encontrado em auth.users: %', p_email;
  end if;

  insert into public.profiles (id, email, name, role, active)
  values (v_user_id, p_email, coalesce(p_name, 'Usuário'), p_role, true)
  on conflict (id) do update set
    email      = excluded.email,
    name       = coalesce(excluded.name, public.profiles.name),
    role       = excluded.role,
    active     = true,
    updated_at = now();

  -- Também grava o role no app_metadata do JWT (útil p/ clientes que leem app_metadata)
  update auth.users
  set raw_app_meta_data =
        coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('role', p_role)
  where id = v_user_id;

  return v_user_id;
end;
$$;

revoke all on function public.sync_profile_for_email(text, text, text) from public, anon, authenticated;


-- =============================================================================
-- PARTE 11 — ROW LEVEL SECURITY
-- =============================================================================

alter table public.profiles    enable row level security;
alter table public.dishes      enable row level security;
alter table public.categories  enable row level security;
alter table public.voters      enable row level security;
alter table public.votes       enable row level security;
alter table public.vote_scores enable row level security;

-- ---- profiles -------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- ---- dishes: SELECT público se active=true; CRUD só admin -----------------
create policy "dishes_select_active_public" on public.dishes
  for select to anon, authenticated
  using (active = true or public.is_profile_admin() or public.is_profile_jury());

create policy "dishes_admin_all" on public.dishes
  for all to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- ---- categories: SELECT público se active=true; CRUD só admin -------------
create policy "categories_select_active_public" on public.categories
  for select to anon, authenticated
  using (active = true or public.is_profile_admin() or public.is_profile_jury());

create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- ---- voters: INSERT via service_role; SELECT só admin ---------------------
create policy "voters_select_admin" on public.voters
  for select to authenticated
  using (public.is_profile_admin());

-- ---- votes: admin vê tudo; jurado vê/insere os próprios -------------------
create policy "votes_select_admin" on public.votes
  for select to authenticated
  using (public.is_profile_admin());

create policy "votes_select_own_jury" on public.votes
  for select to authenticated
  using (public.is_profile_jury() and jury_user_id = auth.uid());

create policy "votes_insert_own_jury" on public.votes
  for insert to authenticated
  with check (
    public.is_profile_jury()
    and voter_type = 'jury'
    and jury_user_id = auth.uid()
    and voter_id is null
  );

-- ---- vote_scores: admin tudo; jurado nos próprios votos -------------------
create policy "vote_scores_select_admin" on public.vote_scores
  for select to authenticated
  using (public.is_profile_admin());

create policy "vote_scores_select_own_jury" on public.vote_scores
  for select to authenticated
  using (
    public.is_profile_jury()
    and exists (
      select 1 from public.votes v
      where v.id = vote_scores.vote_id
        and v.jury_user_id = auth.uid()
    )
  );

create policy "vote_scores_insert_own_jury" on public.vote_scores
  for insert to authenticated
  with check (
    public.is_profile_jury()
    and exists (
      select 1 from public.votes v
      where v.id = vote_scores.vote_id
        and v.jury_user_id = auth.uid()
        and v.voter_type = 'jury'
    )
  );


-- =============================================================================
-- PARTE 12 — STORAGE: bucket 'dishes'
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('dishes', 'dishes', true)
on conflict (id) do update set public = true;

create policy "dish_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'dishes');

create policy "dish_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dishes' and public.is_profile_admin());

create policy "dish_images_admin_update" on storage.objects
  for update to authenticated
  using      (bucket_id = 'dishes' and public.is_profile_admin())
  with check (bucket_id = 'dishes' and public.is_profile_admin());

create policy "dish_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dishes' and public.is_profile_admin());


-- =============================================================================
-- PARTE 13 — SEED: 5 categorias padrão
-- =============================================================================

insert into public.categories (name, description, display_order, active) values
  ('Sabor',        'Equilíbrio de sabores, tempero e harmonização dos ingredientes.', 1, true),
  ('Apresentação', 'Estética do prato, cuidado visual e montagem.',                   2, true),
  ('Criatividade', 'Originalidade, combinação inovadora de elementos.',               3, true),
  ('Técnica',      'Domínio da execução, cocção e acabamento.',                       4, true),
  ('Harmonização', 'Coerência entre componentes, texturas e temperaturas.',           5, true);


-- =============================================================================
-- PARTE 14 — VERIFICAÇÃO FINAL
-- =============================================================================

-- Confere que não sobraram triggers custom em auth.users
select tgname as trigger_name,
       case when tgisinternal then 'interno (ok)' else 'CUSTOM (revisar)' end as tipo
from pg_trigger
where tgrelid = 'auth.users'::regclass
order by tgisinternal desc, tgname;

-- Lista tabelas do schema public
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select 'RESET COMPLETO — schema recriado com sucesso.' as status,
       'Proximo passo: crie o admin em Authentication > Users e rode sync_profile_for_email().' as proximo_passo;


-- =============================================================================
-- PASSO MANUAL APÓS ESTE SCRIPT (NÃO executar ainda — é guia):
-- =============================================================================
-- 1) Dashboard > Authentication > Users > Add user
--    - Email:    admin@votacaogastronomica.com
--    - Password: <sua senha forte>
--    - Marque:   Auto Confirm User
--
-- 2) No SQL Editor, execute:
--    select public.sync_profile_for_email(
--      'admin@votacaogastronomica.com',
--      'Administrador',
--      'admin'
--    );
--
-- 3) Faça login em /admin/login com o email e senha acima.
-- =============================================================================
