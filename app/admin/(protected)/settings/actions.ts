"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { siteSettingsSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

type LogoSlot = "logo_site_url" | "logo_event_url" | "favicon_url" | "logo_footer_url";

const LOGO_FIELDS: Record<string, LogoSlot> = {
  logo_site: "logo_site_url",
  logo_event: "logo_event_url",
  favicon: "favicon_url",
  logo_footer: "logo_footer_url",
};

async function uploadLogo(
  file: File,
  prefix: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = createSupabaseAdminClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from("branding")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };
  const { data: pub } = admin.storage.from("branding").getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}

export async function updateSiteSettings(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const parsed = siteSettingsSchema.safeParse({
    brand_hsl: formData.get("brand_hsl"),
    brand_fg_hsl: formData.get("brand_fg_hsl"),
    accent_hsl: formData.get("accent_hsl"),
    accent_fg_hsl: formData.get("accent_fg_hsl"),
    background_hsl: formData.get("background_hsl"),
    foreground_hsl: formData.get("foreground_hsl"),
    muted_hsl: formData.get("muted_hsl"),
    border_hsl: formData.get("border_hsl"),
    site_name: formData.get("site_name"),
    headline: formData.get("headline"),
    subheadline: formData.get("subheadline"),
    footer_text: formData.get("footer_text"),
    header_sponsor_text: formData.get("header_sponsor_text") ? String(formData.get("header_sponsor_text")).trim() : null,
    card_style: formData.get("card_style"),
    hero_pattern: formData.get("hero_pattern"),
    show_stats: formData.get("show_stats") === "true" || formData.get("show_stats") === "on",
    hero_badge_text: formData.get("hero_badge_text"),
    hero_visual: formData.get("hero_visual"),
    hero_feature_1: formData.get("hero_feature_1"),
    hero_feature_2: formData.get("hero_feature_2"),
    hero_feature_3: formData.get("hero_feature_3"),
    niches_section_title: formData.get("niches_section_title"),
    niches_section_subtitle: formData.get("niches_section_subtitle"),
    show_how_it_works: formData.get("show_how_it_works") === "true" || formData.get("show_how_it_works") === "on",
    how_it_works_title: formData.get("how_it_works_title"),
    how_step_1_title: formData.get("how_step_1_title"),
    how_step_1_desc: formData.get("how_step_1_desc"),
    how_step_2_title: formData.get("how_step_2_title"),
    how_step_2_desc: formData.get("how_step_2_desc"),
    how_step_3_title: formData.get("how_step_3_title"),
    how_step_3_desc: formData.get("how_step_3_desc"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  for (const [field, column] of Object.entries(LOGO_FIELDS)) {
    const file = formData.get(field) as File | null;
    if (file && file.size > 0) {
      const up = await uploadLogo(file, column.replace("_url", ""));
      if (!up.ok) return { ok: false, error: up.error };
      updates[column] = up.url;
    }
  }

  const heroImage = formData.get("hero_image") as File | null;
  if (heroImage && heroImage.size > 0) {
    const up = await uploadLogo(heroImage, "hero_image");
    if (!up.ok) return { ok: false, error: up.error };
    updates.hero_image_url = up.url;
  }

  const { error } = await admin
    .from("site_settings")
    .update(updates)
    .eq("id", 1);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
