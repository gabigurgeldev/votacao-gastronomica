import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import { VotesExplorer } from "./votes-explorer";

export const dynamic = "force-dynamic";

interface VoteRow {
  id: string;
  voter_type: "public" | "jury";
  created_at: string;
  dish_id: string;
  dishes: { id: string; name: string } | null;
  voters: { name: string | null; email: string | null } | null;
  jury_user_id: string | null;
  vote_scores: { category_id: string; score: number; categories: { name: string } | null }[];
}

export default async function AdminVotesPage({
  searchParams,
}: {
  searchParams: { type?: string; dish?: string };
}) {
  const supabase = createSupabaseServerClient();

  const [{ data: dishes }, { data: profiles }] = await Promise.all([
    supabase.from("dishes").select("id, name").order("name"),
    supabase.from("profiles").select("id, name, email").in("role", ["jurado", "admin"]),
  ]);

  const juryNames = new Map<string, string>();
  for (const p of profiles ?? []) {
    juryNames.set(p.id, p.name ?? p.email ?? "");
  }

  let query = supabase
    .from("votes")
    .select(
      `id, voter_type, created_at, dish_id, jury_user_id,
       dishes:dishes(id, name),
       voters:voters(name, email),
       vote_scores:vote_scores(category_id, score, categories:categories(name))`,
    )
    .order("created_at", { ascending: false });

  if (searchParams.type === "public" || searchParams.type === "jury") {
    query = query.eq("voter_type", searchParams.type);
  }
  if (searchParams.dish) {
    query = query.eq("dish_id", searchParams.dish);
  }

  const { data: votes } = await query;

  const totalPublic = (votes ?? []).filter((v) => v.voter_type === "public").length;
  const totalJury = (votes ?? []).filter((v) => v.voter_type === "jury").length;

  return (
    <>
      <PageHeader
        title="Avaliações"
        description={`Público: ${totalPublic} · Jurados: ${totalJury}`}
      />
      <VotesExplorer
        votes={(votes ?? []) as unknown as VoteRow[]}
        dishes={(dishes ?? []) as { id: string; name: string }[]}
        juryNames={Object.fromEntries(juryNames)}
        filter={{ type: searchParams.type ?? "all", dish: searchParams.dish ?? "all" }}
      />
    </>
  );
}
