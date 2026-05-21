"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { nicheFormSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parseForm(formData: FormData) {
  return nicheFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    icon: formData.get("icon") || null,
    display_order: formData.get("display_order") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
}

export async function createNiche(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const { error } = await admin.from("niches").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/nichos");
  revalidatePath("/");
  return { ok: true };
}

export async function updateNiche(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const { error } = await admin
    .from("niches")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      display_order: parsed.data.display_order,
      active: parsed.data.active,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/nichos");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNiche(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("niches").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/nichos");
  revalidatePath("/");
  return { ok: true };
}
