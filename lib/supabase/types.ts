export type UserRole = "admin" | "jurado";

export type VoterType = "public" | "jury";

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Voter {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  voter_type: VoterType;
  voter_id: string | null;
  jury_user_id: string | null;
  dish_id: string;
  created_at: string;
}

export interface VoteScore {
  id: string;
  vote_id: string;
  category_id: string;
  score: number;
  created_at: string;
}

export interface DishRankingRow {
  dish_id: string;
  dish_name: string;
  image_url: string | null;
  total_votes: number;
  avg_score_overall: number | null;
  avg_score_public: number | null;
  avg_score_jury: number | null;
}

export interface DishCategoryAvgRow {
  dish_id: string;
  dish_name: string;
  category_id: string;
  category_name: string;
  voter_type: VoterType | null;
  total_scores: number;
  avg_score: number | null;
}

// Views do dashboard de métricas

export interface VotesByTypeRow {
  voter_type: "public" | "jury" | "total";
  total_votes: number;
  dishes_voted: number;
}

export interface DishCategoryDetailedRow {
  dish_id: string;
  dish_name: string;
  image_url: string | null;
  category_id: string;
  category_name: string;
  avg_score_overall: number | null;
  total_scores_overall: number;
  avg_score_public: number | null;
  total_scores_public: number;
  avg_score_jury: number | null;
  total_scores_jury: number;
}

export interface JuryVoteSummary {
  jury_id: string;
  email: string;
  jury_name: string;
  total_votes: number;
  unique_dishes: number;
  avg_score_given: number | null;
  last_vote_at: string | null;
}

export interface DishRankingByTypeRow {
  dish_id: string;
  dish_name: string;
  image_url: string | null;
  voter_type: VoterType | null;
  total_votes: number;
  avg_score: number | null;
}
