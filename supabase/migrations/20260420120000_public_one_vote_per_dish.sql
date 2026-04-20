-- Permite que o mesmo votante público avalie vários pratos (uma avaliação por par votante+prato).

DROP INDEX IF EXISTS public.uq_votes_public_one_per_voter;

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_public_one_per_dish_per_voter
  ON public.votes (voter_id, dish_id)
  WHERE voter_type = 'public';
