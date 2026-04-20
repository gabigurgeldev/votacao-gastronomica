-- =============================================================================
-- Views de agregação (security_invoker para respeitar RLS do caller)
-- =============================================================================

-- Média de um prato por tipo de votante (público/jurado)
create or replace view public.v_dish_averages
with (security_invoker = true) as
select
  d.id                                                          as dish_id,
  d.name                                                        as dish_name,
  v.voter_type                                                  as voter_type,
  count(distinct v.id)                                          as total_votes,
  round(avg(vs.score)::numeric, 2)                              as avg_score
from public.dishes d
left join public.votes       v  on v.dish_id = d.id
left join public.vote_scores vs on vs.vote_id = v.id
group by d.id, d.name, v.voter_type;

-- Média por prato e categoria
create or replace view public.v_dish_category_averages
with (security_invoker = true) as
select
  d.id                              as dish_id,
  d.name                            as dish_name,
  c.id                              as category_id,
  c.name                            as category_name,
  v.voter_type                      as voter_type,
  count(vs.id)                      as total_scores,
  round(avg(vs.score)::numeric, 2)  as avg_score
from public.dishes d
cross join public.categories c
left join public.votes       v  on v.dish_id = d.id
left join public.vote_scores vs on vs.vote_id = v.id and vs.category_id = c.id
group by d.id, d.name, c.id, c.name, v.voter_type;

-- Ranking geral (média combinada de todos os tipos)
create or replace view public.v_dish_ranking
with (security_invoker = true) as
select
  d.id                                    as dish_id,
  d.name                                  as dish_name,
  d.image_url                             as image_url,
  count(distinct v.id)                    as total_votes,
  round(avg(vs.score)::numeric, 2)        as avg_score_overall,
  round(avg(vs.score) filter (where v.voter_type = 'public')::numeric, 2) as avg_score_public,
  round(avg(vs.score) filter (where v.voter_type = 'jury')::numeric, 2)   as avg_score_jury
from public.dishes d
left join public.votes       v  on v.dish_id = d.id
left join public.vote_scores vs on vs.vote_id = v.id
where d.active = true
group by d.id, d.name, d.image_url;
