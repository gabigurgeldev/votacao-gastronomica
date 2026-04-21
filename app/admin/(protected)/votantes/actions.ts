"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateVoterRelated() {
  revalidatePath("/admin/votantes");
  revalidatePath("/admin/votos");
  revalidatePath("/admin/dashboard");
}

export async function deleteVoter(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("voters").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateVoterRelated();
  return { ok: true };
}
