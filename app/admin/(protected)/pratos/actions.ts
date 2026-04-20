"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { dishFormSchema } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createDish(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const imageFile = formData.get("image") as File | null;
  const parsed = dishFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    display_order: formData.get("display_order") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("dishes")
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (upErr) return { ok: false, error: upErr.message };
    const { data: pub } = admin.storage.from("dishes").getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  const { error } = await admin.from("dishes").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
    image_url: imageUrl,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pratos");
  revalidatePath("/");
  return { ok: true };
}

export async function updateDish(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();

  const imageFile = formData.get("image") as File | null;
  const parsed = dishFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    display_order: formData.get("display_order") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }

  const updates: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    display_order: parsed.data.display_order,
    active: parsed.data.active,
  };

  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `dishes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("dishes")
      .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
    if (upErr) return { ok: false, error: upErr.message };
    const { data: pub } = admin.storage.from("dishes").getPublicUrl(path);
    updates.image_url = pub.publicUrl;
  }

  const { error } = await admin.from("dishes").update(updates).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/pratos");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteDish(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("dishes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pratos");
  revalidatePath("/");
  return { ok: true };
}
