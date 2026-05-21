import { z } from "zod";

export const nicheFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do nicho.").max(80),
  description: z.string().trim().max(400).optional().nullable(),
  icon: z.string().trim().max(40).optional().nullable(),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export type NicheFormInput = z.infer<typeof nicheFormSchema>;

export const companyFormSchema = z.object({
  niche_id: z.string().uuid("Selecione um nicho."),
  name: z.string().trim().min(2, "Informe o nome da empresa.").max(120),
  display_order: z.coerce.number().int().min(0).default(0),
  active: z.coerce.boolean().default(true),
});

export type CompanyFormInput = z.infer<typeof companyFormSchema>;

export const voteNicheSchema = z.object({
  nicheId: z.string().uuid(),
  companyId: z.string().uuid(),
});

export type VoteNicheInput = z.infer<typeof voteNicheSchema>;

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(120, "Nome muito longo."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres.")
    .max(72),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(6, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

const hslRegex = /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/;

export const siteSettingsSchema = z.object({
  brand_hsl: z.string().regex(hslRegex, "Cor inválida."),
  brand_fg_hsl: z.string().regex(hslRegex, "Cor inválida."),
  accent_hsl: z.string().regex(hslRegex, "Cor inválida."),
  accent_fg_hsl: z.string().regex(hslRegex, "Cor inválida."),
  background_hsl: z.string().regex(hslRegex, "Cor inválida."),
  foreground_hsl: z.string().regex(hslRegex, "Cor inválida."),
  muted_hsl: z.string().regex(hslRegex, "Cor inválida."),
  border_hsl: z.string().regex(hslRegex, "Cor inválida."),
  site_name: z.string().trim().min(1).max(80),
  headline: z.string().trim().min(1).max(200),
  subheadline: z.string().trim().min(1).max(400),
  footer_text: z.string().trim().min(1).max(200),
  header_sponsor_text: z.string().trim().max(100).optional().nullable(),
  card_style: z.enum(["glass", "flat", "elevated"]),
  hero_pattern: z.enum(["none", "dots", "grid", "waves"]),
  show_stats: z.coerce.boolean(),
  hero_badge_text: z.string().trim().min(1).max(60),
  hero_visual: z.enum(["orbs", "bento", "image", "minimal"]),
  hero_feature_1: z.string().trim().min(1).max(80),
  hero_feature_2: z.string().trim().min(1).max(80),
  hero_feature_3: z.string().trim().min(1).max(80),
  niches_section_title: z.string().trim().min(1).max(120),
  niches_section_subtitle: z.string().trim().min(1).max(200),
  show_how_it_works: z.coerce.boolean(),
  how_it_works_title: z.string().trim().min(1).max(80),
  how_step_1_title: z.string().trim().min(1).max(80),
  how_step_1_desc: z.string().trim().min(1).max(200),
  how_step_2_title: z.string().trim().min(1).max(80),
  how_step_2_desc: z.string().trim().min(1).max(200),
  how_step_3_title: z.string().trim().min(1).max(80),
  how_step_3_desc: z.string().trim().min(1).max(200),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
