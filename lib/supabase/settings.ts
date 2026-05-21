import { createSupabaseServerClient } from "./server";
import type { SiteSettings } from "./types";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  brand_hsl: "345 62% 30%",
  brand_fg_hsl: "36 35% 98%",
  accent_hsl: "32 92% 52%",
  accent_fg_hsl: "24 14% 12%",
  background_hsl: "36 35% 98%",
  foreground_hsl: "24 14% 12%",
  muted_hsl: "30 24% 93%",
  border_hsl: "28 20% 87%",
  site_name: "Votação",
  headline: "Vote nas melhores empresas da noite.",
  subheadline: "Escolha sua empresa favorita em cada nicho.",
  footer_text: "Todos os direitos reservados",
  logo_site_url: null,
  logo_event_url: null,
  favicon_url: null,
  logo_footer_url: null,
  header_sponsor_text: null,
  card_style: "glass",
  hero_pattern: "dots",
  show_stats: true,
  hero_badge_text: "Votações abertas",
  hero_visual: "bento",
  hero_image_url: null,
  hero_feature_1: "Um voto por nicho",
  hero_feature_2: "Conta necessária para votar",
  hero_feature_3: "Rápido e sem app",
  niches_section_title: "Nichos para votar",
  niches_section_subtitle: "Toque em um nicho para ver as empresas",
  show_how_it_works: true,
  how_it_works_title: "Como funciona",
  how_step_1_title: "Crie sua conta",
  how_step_1_desc: "Cadastre-se em segundos com e-mail e senha.",
  how_step_2_title: "Escolha um nicho",
  how_step_2_desc: "Explore as categorias e veja as empresas indicadas.",
  how_step_3_title: "Vote com segurança",
  how_step_3_desc: "Um voto por nicho. Resultados confiáveis para o evento.",
  updated_at: new Date(0).toISOString(),
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!data) return DEFAULT_SITE_SETTINGS;
    return { ...DEFAULT_SITE_SETTINGS, ...data } as SiteSettings;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
