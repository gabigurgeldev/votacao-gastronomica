"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { categoryFormSchema } from "@/lib/validators";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function upsertCategory(id: string | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const parsed = categoryFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    display_order: formData.get("display_order") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }
  const payload = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
  };
  const { error } = id
    ? await admin.from("categories").update(payload).eq("id", id)
    : await admin.from("categories").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Esta categoria já possui votos associados. Desative-a em vez de excluir.",
      };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return { ok: true };
}
