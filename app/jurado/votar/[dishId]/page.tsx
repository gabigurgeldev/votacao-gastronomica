import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Dish } from "@/lib/supabase/types";
import { JuryVoteForm } from "./vote-form";

export const dynamic = "force-dynamic";

export default async function JuryVotePage({
  params,
}: {
  params: { dishId: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const juryId = userData.user?.id;

  const [{ data: dish }, { data: categories }] = await Promise.all([
    supabase
      .from("dishes")
      .select("*")
      .eq("id", params.dishId)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  if (!dish) notFound();

  let existing: Record<string, number> = {};
  if (juryId) {
    const { data: voteRow } = await supabase
      .from("votes")
      .select("id, vote_scores(category_id, score)")
      .eq("voter_type", "jury")
      .eq("jury_user_id", juryId)
      .eq("dish_id", dish.id)
      .maybeSingle();
    if (voteRow?.vote_scores) {
      existing = Object.fromEntries(
        voteRow.vote_scores.map((s: { category_id: string; score: number }) => [
          s.category_id,
          Number(s.score),
        ]),
      );
    }
  }

  return (
    <>
      <Link
        href="/jurado/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos pratos
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-card">
            {(dish as Dish).image_url ? (
              <Image
                src={(dish as Dish).image_url!}
                alt={(dish as Dish).name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ChefHat className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <h1 className="mt-6 font-display text-4xl tracking-tight">
            {(dish as Dish).name}
          </h1>
          {(dish as Dish).description && (
            <p className="mt-2 text-muted-foreground">
              {(dish as Dish).description}
            </p>
          )}
        </div>

        <div>
          <JuryVoteForm
            dishId={(dish as Dish).id}
            categories={(categories ?? []) as Category[]}
            initialScores={existing}
          />
        </div>
      </div>
    </>
  );
}
