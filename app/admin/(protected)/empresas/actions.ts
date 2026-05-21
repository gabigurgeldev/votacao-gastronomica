"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { companyFormSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parseForm(formData: FormData) {
  return companyFormSchema.safeParse({
    niche_id: formData.get("niche_id"),
    name: formData.get("name"),
    display_order: formData.get("display_order") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
}

async function uploadLogoIfProvided(formData: FormData): Promise<
  | { ok: true; url: string | null }
  | { ok: false; error: string }
> {
  const admin = createSupabaseAdminClient();
  const logoFile = formData.get("logo") as File | null;
  if (!logoFile || logoFile.size === 0) return { ok: true, url: null };

  const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
  const path = `companies/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.storage
    .from("companies")
    .upload(path, logoFile, { contentType: logoFile.type, upsert: false });
  if (error) return { ok: false, error: error.message };
  const { data: pub } = admin.storage.from("companies").getPublicUrl(path);
  return { ok: true, url: pub.publicUrl };
}

export async function createCompany(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const upload = await uploadLogoIfProvided(formData);
  if (!upload.ok) return { ok: false, error: upload.error };

  const { error } = await admin.from("companies").insert({
    niche_id: parsed.data.niche_id,
    name: parsed.data.name,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
    logo_url: upload.url,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/empresas");
  revalidatePath("/");
  return { ok: true };
}

export async function updateCompany(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const upload = await uploadLogoIfProvided(formData);
  if (!upload.ok) return { ok: false, error: upload.error };

  const updates: Record<string, unknown> = {
    niche_id: parsed.data.niche_id,
    name: parsed.data.name,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
  };
  if (upload.url) updates.logo_url = upload.url;

  const { error } = await admin.from("companies").update(updates).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/empresas");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("companies").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/empresas");
  revalidatePath("/");
  return { ok: true };
}
