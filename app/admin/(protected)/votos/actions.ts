"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateVoteRelated() {
  revalidatePath("/admin/votantes");
  revalidatePath("/admin/votos");
  revalidatePath("/admin/dashboard");
}

export async function deleteVote(id: string): Promise<ActionResult> {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("votes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateVoteRelated();
  return { ok: true };
}
