-- =============================================================================
-- Views de métricas do dashboard (security_invoker para respeitar RLS)
-- =============================================================================

-- View: contagem de votos separados por tipo (public/jury) e totais
CREATE OR REPLACE VIEW public.v_votes_by_type
WITH (security_invoker = true) AS
SELECT
  'public'::text AS voter_type,
  COUNT(*) AS total_votes,
  COUNT(DISTINCT dish_id) AS dishes_voted
FROM public.votes
WHERE voter_type = 'public'
UNION ALL
SELECT
  'jury'::text AS voter_type,
  COUNT(*) AS total_votes,
  COUNT(DISTINCT dish_id) AS dishes_voted
FROM public.votes
WHERE voter_type = 'jury'
UNION ALL
SELECT
  'total'::text AS voter_type,
  COUNT(*) AS total_votes,
  COUNT(DISTINCT dish_id) AS dishes_voted
FROM public.votes;

-- View: médias por prato separando público e jurado (formato pivotado para facilitar UI)
CREATE OR REPLACE VIEW public.v_dish_category_detailed
WITH (security_invoker = true) AS
SELECT
  d.id AS dish_id,
  d.name AS dish_name,
  d.image_url,
  c.id AS category_id,
  c.name AS category_name,
  -- Média geral (todos os votos)
  ROUND(AVG(vs.score)::numeric, 2) AS avg_score_overall,
  COUNT(vs.id) AS total_scores_overall,
  -- Média do público
  ROUND(AVG(vs.score) FILTER (WHERE v.voter_type = 'public')::numeric, 2) AS avg_score_public,
  COUNT(vs.id) FILTER (WHERE v.voter_type = 'public') AS total_scores_public,
  -- Média dos jurados
  ROUND(AVG(vs.score) FILTER (WHERE v.voter_type = 'jury')::numeric, 2) AS avg_score_jury,
  COUNT(vs.id) FILTER (WHERE v.voter_type = 'jury') AS total_scores_jury
FROM public.dishes d
CROSS JOIN public.categories c
LEFT JOIN public.votes v ON v.dish_id = d.id
LEFT JOIN public.vote_scores vs ON vs.vote_id = v.id AND vs.category_id = c.id
WHERE d.active = true AND c.active = true
GROUP BY d.id, d.name, d.image_url, c.id, c.name;

-- View: resumo de votos por jurado (para métricas de participação)
CREATE OR REPLACE VIEW public.v_jury_vote_summary
WITH (security_invoker = true) AS
SELECT
  p.id AS jury_id,
  p.email,
  p.name AS jury_name,
  COUNT(v.id) AS total_votes,
  COUNT(DISTINCT v.dish_id) AS unique_dishes,
  ROUND(AVG(vs.score)::numeric, 2) AS avg_score_given,
  MAX(v.created_at) AS last_vote_at
FROM public.profiles p
LEFT JOIN public.votes v ON v.jury_user_id = p.id AND v.voter_type = 'jury'
LEFT JOIN public.vote_scores vs ON vs.vote_id = v.id
WHERE p.role = 'jurado'
GROUP BY p.id, p.email, p.name;

-- View: ranking separado por tipo de votante (público ou jurado)
CREATE OR REPLACE VIEW public.v_dish_ranking_by_type
WITH (security_invoker = true) AS
SELECT
  d.id AS dish_id,
  d.name AS dish_name,
  d.image_url,
  v.voter_type,
  COUNT(DISTINCT v.id) AS total_votes,
  ROUND(AVG(vs.score)::numeric, 2) AS avg_score
FROM public.dishes d
LEFT JOIN public.votes v ON v.dish_id = d.id
LEFT JOIN public.vote_scores vs ON vs.vote_id = v.id
WHERE d.active = true
GROUP BY d.id, d.name, d.image_url, v.voter_type;

-- Comentários para documentação
COMMENT ON VIEW public.v_votes_by_type IS 'Contagem total de votos separados por tipo (public/jury/total)';
COMMENT ON VIEW public.v_dish_category_detailed IS 'Médias por prato e categoria separando público, jurado e combinado';
COMMENT ON VIEW public.v_jury_vote_summary IS 'Resumo de participação e médias por jurado';
COMMENT ON VIEW public.v_dish_ranking_by_type IS 'Ranking de pratos separado por tipo de votante';
