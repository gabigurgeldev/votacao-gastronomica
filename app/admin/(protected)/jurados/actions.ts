"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { juryCreateSchema } from "@/lib/validators";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createJury(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = juryCreateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Inválido." };
  }
  const admin = createSupabaseAdminClient();

  // Criar usuário com auto-confirmação e role jurado
  const { error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true, // Auto-confirma o e-mail
    app_metadata: { role: "jurado" },
    user_metadata: { name: parsed.data.name },
  });
  if (createError) return { ok: false, error: createError.message };

  // Sincronizar com a tabela profiles via RPC (garante email, nome e role)
  const { error: syncError } = await admin.rpc("sync_profile_for_email", {
    p_email: parsed.data.email,
    p_name: parsed.data.name,
    p_role: "jurado",
  });
  if (syncError) {
    console.error("Erro ao sincronizar profile:", syncError);
    // Não retornamos erro aqui pois o usuário já foi criado
  }

  revalidatePath("/admin/jurados");
  return { ok: true };
}

export async function deleteJury(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/jurados");
  return { ok: true };
}

export async function resetJuryPassword(userId: string, password: string): Promise<ActionResult> {
  await requireAdmin();
  if (password.length < 8) return { ok: false, error: "Senha muito curta." };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
