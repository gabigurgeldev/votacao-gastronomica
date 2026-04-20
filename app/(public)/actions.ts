"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { publicVoteSchema } from "@/lib/validators";
import { getClientIp } from "@/lib/utils";

export type SubmitResult =
  | { ok: true; voterId: string }
  | { ok: false; error: string; code?: "duplicate" | "invalid" | "db" };

export async function submitPublicVote(raw: unknown): Promise<SubmitResult> {
  const parsed = publicVoteSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      code: "invalid",
      error: first?.message ?? "Dados inválidos.",
    };
  }

  const { dishId, scores, voter } = parsed.data;
  const h = headers();
  const ip = getClientIp(h);
  const userAgent = h.get("user-agent");

  const admin = createSupabaseAdminClient();

  const { data: dish, error: dishErr } = await admin
    .from("dishes")
    .select("id, active")
    .eq("id", dishId)
    .maybeSingle();
  if (dishErr || !dish || !dish.active) {
    return { ok: false, code: "invalid", error: "Prato indisponível." };
  }

  const { data: categoriesRows, error: catErr } = await admin
    .from("categories")
    .select("id")
    .eq("active", true);
  if (catErr) return { ok: false, code: "db", error: catErr.message };

  const activeIds = new Set((categoriesRows ?? []).map((c) => c.id));
  const submittedIds = new Set(scores.map((s) => s.categoryId));

  if (
    activeIds.size !== submittedIds.size ||
    ![...activeIds].every((id) => submittedIds.has(id))
  ) {
    return {
      ok: false,
      code: "invalid",
      error: "Avalie todas as categorias obrigatórias.",
    };
  }

  const { data: existingVoter } = await admin
    .from("voters")
    .select("id")
    .or(`cpf.eq.${voter.cpf},email.eq.${voter.email}`)
    .maybeSingle();

  let voterId: string;

  if (existingVoter) {
    voterId = existingVoter.id;
  } else {
    const { data: inserted, error: voterErr } = await admin
      .from("voters")
      .insert({
        name: voter.name,
        phone: voter.phone,
        email: voter.email,
        cpf: voter.cpf,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select("id")
      .single();
    if (voterErr || !inserted) {
      if (voterErr?.code === "23505") {
        const { data: retry } = await admin
          .from("voters")
          .select("id")
          .or(`cpf.eq.${voter.cpf},email.eq.${voter.email}`)
          .maybeSingle();
        if (retry) {
          voterId = retry.id;
        } else {
          return {
            ok: false,
            code: "duplicate",
            error: "Não foi possível confirmar seu cadastro. Tente novamente.",
          };
        }
      } else {
        return { ok: false, code: "db", error: voterErr?.message ?? "Falha ao cadastrar." };
      }
    } else {
      voterId = inserted.id;
    }
  }

  const { data: existingVote } = await admin
    .from("votes")
    .select("id")
    .eq("voter_type", "public")
    .eq("voter_id", voterId)
    .eq("dish_id", dishId)
    .maybeSingle();

  if (existingVote) {
    return {
      ok: false,
      code: "duplicate",
      error:
        "Você já registrou uma avaliação para este prato. Cada pessoa pode avaliar cada prato apenas uma vez.",
    };
  }

  const { data: voteRow, error: voteErr } = await admin
    .from("votes")
    .insert({
      voter_type: "public",
      voter_id: voterId,
      dish_id: dishId,
    })
    .select("id")
    .single();

  let voteId: string;

  if (voteErr || !voteRow) {
    if (voteErr?.code === "23505") {
      const { data: concurrent } = await admin
        .from("votes")
        .select("id")
        .eq("voter_type", "public")
        .eq("voter_id", voterId)
        .eq("dish_id", dishId)
        .maybeSingle();
      if (concurrent) {
        return {
          ok: false,
          code: "duplicate",
          error:
            "Você já registrou uma avaliação para este prato. Cada pessoa pode avaliar cada prato apenas uma vez.",
        };
      }
    }
    return {
      ok: false,
      code: voteErr?.code === "23505" ? "duplicate" : "db",
      error:
        voteErr?.code === "23505"
          ? "Esta avaliação já foi registrada."
          : voteErr?.message ?? "Falha ao registrar avaliação.",
    };
  }

  voteId = voteRow.id;

  const scoreRows = scores.map((s) => ({
    vote_id: voteId,
    category_id: s.categoryId,
    score: s.score,
  }));

  const { error: scoresErr } = await admin.from("vote_scores").insert(scoreRows);
  if (scoresErr) {
    return { ok: false, code: "db", error: scoresErr.message };
  }

  revalidatePath("/");
  return { ok: true, voterId };
}
