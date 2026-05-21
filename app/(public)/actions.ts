"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { voteNicheSchema } from "@/lib/validators";

export type VoteResult =
  | { ok: true }
  | { ok: false; error: string; code?: "duplicate" | "invalid" | "unauthenticated" | "db" };

export async function submitNicheVote(raw: unknown): Promise<VoteResult> {
  const parsed = voteNicheSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid",
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      ok: false,
      code: "unauthenticated",
      error: "Faça login ou crie sua conta para votar.",
    };
  }
  const userId = userData.user.id;

  const admin = createSupabaseAdminClient();

  const { data: company, error: cErr } = await admin
    .from("companies")
    .select("id, niche_id, active")
    .eq("id", parsed.data.companyId)
    .maybeSingle();

  if (cErr || !company || !company.active) {
    return { ok: false, code: "invalid", error: "Empresa indisponível." };
  }
  if (company.niche_id !== parsed.data.nicheId) {
    return { ok: false, code: "invalid", error: "Empresa não pertence a este nicho." };
  }

  const { data: niche, error: nErr } = await admin
    .from("niches")
    .select("id, active")
    .eq("id", parsed.data.nicheId)
    .maybeSingle();

  if (nErr || !niche || !niche.active) {
    return { ok: false, code: "invalid", error: "Nicho indisponível." };
  }

  const { error: insErr } = await admin.from("votes").insert({
    voter_user_id: userId,
    niche_id: parsed.data.nicheId,
    company_id: parsed.data.companyId,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return {
        ok: false,
        code: "duplicate",
        error: "Você já votou neste nicho.",
      };
    }
    return { ok: false, code: "db", error: insErr.message };
  }

  revalidatePath("/");
  return { ok: true };
}
