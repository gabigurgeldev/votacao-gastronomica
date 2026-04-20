"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireJury } from "@/lib/supabase/auth-helpers";
import { juryVoteSchema } from "@/lib/validators";

export type JuryVoteResult =
  | { ok: true }
  | { ok: false; error: string; code?: "duplicate" | "invalid" | "db" };

export async function submitJuryVote(raw: unknown): Promise<JuryVoteResult> {
  const { supabase, user } = await requireJury();

  const parsed = juryVoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      code: "invalid",
    };
  }

  const { dishId, scores } = parsed.data;

  const { data: activeCats } = await supabase
    .from("categories")
    .select("id")
    .eq("active", true);
  const activeIds = new Set((activeCats ?? []).map((c) => c.id));
  const submittedIds = new Set(scores.map((s) => s.categoryId));
  if (
    activeIds.size !== submittedIds.size ||
    ![...activeIds].every((id) => submittedIds.has(id))
  ) {
    return {
      ok: false,
      code: "invalid",
      error: "Avalie todas as categorias.",
    };
  }

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("voter_type", "jury")
    .eq("jury_user_id", user.id)
    .eq("dish_id", dishId)
    .maybeSingle();

  if (existing) {
    await supabase.from("vote_scores").delete().eq("vote_id", existing.id);
    const rows = scores.map((s) => ({
      vote_id: existing.id,
      category_id: s.categoryId,
      score: s.score,
    }));
    const { error } = await supabase.from("vote_scores").insert(rows);
    if (error) return { ok: false, code: "db", error: error.message };
    revalidatePath("/jurado/dashboard");
    revalidatePath(`/jurado/votar/${dishId}`);
    return { ok: true };
  }

  const { data: voteRow, error: voteErr } = await supabase
    .from("votes")
    .insert({
      voter_type: "jury",
      jury_user_id: user.id,
      dish_id: dishId,
    })
    .select("id")
    .single();

  if (voteErr || !voteRow) {
    return { ok: false, code: "db", error: voteErr?.message ?? "Erro" };
  }

  const rows = scores.map((s) => ({
    vote_id: voteRow.id,
    category_id: s.categoryId,
    score: s.score,
  }));
  const { error: scoresErr } = await supabase.from("vote_scores").insert(rows);
  if (scoresErr) {
    await supabase.from("votes").delete().eq("id", voteRow.id);
    return { ok: false, code: "db", error: scoresErr.message };
  }

  revalidatePath("/jurado/dashboard");
  revalidatePath(`/jurado/votar/${dishId}`);
  return { ok: true };
}
