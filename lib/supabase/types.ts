export type UserRole = "admin" | "voter";

export interface Niche {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  niche_id: string;
  name: string;
  logo_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  voter_user_id: string;
  niche_id: string;
  company_id: string;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  brand_hsl: string;
  brand_fg_hsl: string;
  accent_hsl: string;
  accent_fg_hsl: string;
  background_hsl: string;
  foreground_hsl: string;
  muted_hsl: string;
  border_hsl: string;
  site_name: string;
  headline: string;
  subheadline: string;
  footer_text: string;
  logo_site_url: string | null;
  logo_event_url: string | null;
  favicon_url: string | null;
  logo_footer_url: string | null;
  header_sponsor_text: string | null;
  card_style: "glass" | "flat" | "elevated";
  hero_pattern: "none" | "dots" | "grid" | "waves";
  show_stats: boolean;
  hero_badge_text: string;
  hero_visual: "orbs" | "bento" | "image" | "minimal";
  hero_image_url: string | null;
  hero_feature_1: string;
  hero_feature_2: string;
  hero_feature_3: string;
  niches_section_title: string;
  niches_section_subtitle: string;
  show_how_it_works: boolean;
  how_it_works_title: string;
  how_step_1_title: string;
  how_step_1_desc: string;
  how_step_2_title: string;
  how_step_2_desc: string;
  how_step_3_title: string;
  how_step_3_desc: string;
  updated_at: string;
}

export interface NicheResultRow {
  niche_id: string;
  niche_name: string;
  company_id: string | null;
  company_name: string | null;
  logo_url: string | null;
  total_votes: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole | "jurado";
  active: boolean;
  created_at: string;
  updated_at: string;
}
