-- =============================================================================
-- Row Level Security — todas as tabelas expostas devem ter RLS habilitada
-- =============================================================================

alter table public.dishes       enable row level security;
alter table public.categories   enable row level security;
alter table public.voters       enable row level security;
alter table public.votes        enable row level security;
alter table public.vote_scores  enable row level security;

-- -----------------------------------------------------------------------------
-- dishes: SELECT público (ativos); CRUD apenas admin
-- -----------------------------------------------------------------------------
drop policy if exists "dishes_select_active_public" on public.dishes;
create policy "dishes_select_active_public" on public.dishes
  for select to anon, authenticated
  using (active = true or public.is_admin() or public.is_jury());

drop policy if exists "dishes_admin_all" on public.dishes;
create policy "dishes_admin_all" on public.dishes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- categories: SELECT público (ativas); CRUD apenas admin
-- -----------------------------------------------------------------------------
drop policy if exists "categories_select_active_public" on public.categories;
create policy "categories_select_active_public" on public.categories
  for select to anon, authenticated
  using (active = true or public.is_admin() or public.is_jury());

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- voters: INSERT não exposto via anon (server action usa service_role)
--         SELECT apenas admin
-- -----------------------------------------------------------------------------
drop policy if exists "voters_select_admin" on public.voters;
create policy "voters_select_admin" on public.voters
  for select to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- votes: SELECT admin tudo; jurado vê os próprios
--        INSERT jurado (apenas os próprios); público via service_role
-- -----------------------------------------------------------------------------
drop policy if exists "votes_select_admin" on public.votes;
create policy "votes_select_admin" on public.votes
  for select to authenticated
  using (public.is_admin());

drop policy if exists "votes_select_own_jury" on public.votes;
create policy "votes_select_own_jury" on public.votes
  for select to authenticated
  using (public.is_jury() and jury_user_id = auth.uid());

drop policy if exists "votes_insert_own_jury" on public.votes;
create policy "votes_insert_own_jury" on public.votes
  for insert to authenticated
  with check (
    public.is_jury()
    and voter_type = 'jury'
    and jury_user_id = auth.uid()
    and voter_id is null
  );

-- -----------------------------------------------------------------------------
-- vote_scores: admin tudo; jurado vê/insere nos votos dele
-- -----------------------------------------------------------------------------
drop policy if exists "vote_scores_select_admin" on public.vote_scores;
create policy "vote_scores_select_admin" on public.vote_scores
  for select to authenticated
  using (public.is_admin());

drop policy if exists "vote_scores_select_own_jury" on public.vote_scores;
create policy "vote_scores_select_own_jury" on public.vote_scores
  for select to authenticated
  using (
    public.is_jury()
    and exists (
      select 1 from public.votes v
      where v.id = vote_scores.vote_id
        and v.jury_user_id = auth.uid()
    )
  );

drop policy if exists "vote_scores_insert_own_jury" on public.vote_scores;
create policy "vote_scores_insert_own_jury" on public.vote_scores
  for insert to authenticated
  with check (
    public.is_jury()
    and exists (
      select 1 from public.votes v
      where v.id = vote_scores.vote_id
        and v.jury_user_id = auth.uid()
        and v.voter_type = 'jury'
    )
  );
