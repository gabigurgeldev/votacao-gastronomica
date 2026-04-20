import { Users, Vote as VoteIcon, UtensilsCrossed, Trophy } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import { KpiCard } from "../../_components/kpi-card";
import { CategoryAveragesChart } from "./category-chart";
import { KpiVoteCards } from "./kpi-vote-cards";
import { VoteMetricsTabs } from "./vote-metrics-tabs";
import { DishCategoryTable } from "./dish-category-table";
import { DishCategoryComparisonChart } from "./dish-category-comparison-chart";
import { formatAvg } from "@/lib/utils";
import type {
  DishCategoryAvgRow,
  DishRankingRow,
  DishCategoryDetailedRow,
  DishRankingByTypeRow,
  VotesByTypeRow,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const [
    { count: votersCount },
    { count: dishesCount },
    { count: votesCount },
    { data: rankingRows },
    { data: categoryAvgRows },
    { data: votesByType },
    { data: categoryDetailedRows },
    { data: rankingByTypeRows },
  ] = await Promise.all([
    supabase.from("voters").select("*", { count: "exact", head: true }),
    supabase
      .from("dishes")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase
      .from("v_dish_ranking")
      .select("*")
      .order("avg_score_overall", { ascending: false, nullsFirst: false }),
    supabase.from("v_dish_category_averages").select("*"),
    // Novas views de métricas
    supabase.from("v_votes_by_type").select("*"),
    supabase.from("v_dish_category_detailed").select("*"),
    supabase.from("v_dish_ranking_by_type").select("*"),
  ]);

  const ranking = (rankingRows ?? []) as DishRankingRow[];
  const topDish = ranking.find((r) => r.avg_score_overall !== null) ?? null;

  // Processar dados de avaliações por tipo
  const votesByTypeData = (votesByType ?? []) as VotesByTypeRow[];
  const publicData = votesByTypeData.find((v) => v.voter_type === "public");
  const juryData = votesByTypeData.find((v) => v.voter_type === "jury");

  // Calcular médias gerais por tipo
  const categoryDetailedData = (categoryDetailedRows ?? []) as DishCategoryDetailedRow[];

  const validPublicScores = categoryDetailedData
    .map((r) => r.avg_score_public)
    .filter((s): s is number => s != null);
  const avgPublic =
    validPublicScores.length > 0
      ? validPublicScores.reduce((a, b) => a + b, 0) / validPublicScores.length
      : null;

  const validJuryScores = categoryDetailedData
    .map((r) => r.avg_score_jury)
    .filter((s): s is number => s != null);
  const avgJury =
    validJuryScores.length > 0
      ? validJuryScores.reduce((a, b) => a + b, 0) / validJuryScores.length
      : null;

  // Separar ranking por tipo
  const rankingByTypeData = (rankingByTypeRows ?? []) as DishRankingByTypeRow[];
  const publicRanking = rankingByTypeData.filter((r) => r.voter_type === "public");
  const juryRanking = rankingByTypeData.filter((r) => r.voter_type === "jury");

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Avaliações (5 a 10), ranking dos pratos e médias por categoria."
      />

      {/* Resumo geral */}
      <section aria-labelledby="resumo-geral" className="space-y-4">
        <SectionTitle id="resumo-geral">Resumo geral</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Avaliações totais"
            value={String(votesCount ?? 0)}
            icon={<VoteIcon className="h-5 w-5" />}
          />
          <KpiCard
            label="Votantes cadastrados"
            value={String(votersCount ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            label="Pratos ativos"
            value={String(dishesCount ?? 0)}
            icon={<UtensilsCrossed className="h-5 w-5" />}
            accent="accent"
          />
          <KpiCard
            label="Melhor média"
            value={topDish ? formatAvg(topDish.avg_score_overall) : "—"}
            sublabel={topDish?.dish_name ?? "Sem avaliações ainda"}
            icon={<Trophy className="h-5 w-5" />}
            accent="success"
          />
        </div>
      </section>

      {/* Público x Jurados */}
      <section aria-labelledby="por-tipo" className="mt-10 space-y-4">
        <SectionTitle id="por-tipo">Público x Jurados</SectionTitle>
        <KpiVoteCards
          votesByType={votesByTypeData}
          avgPublic={avgPublic}
          avgJury={avgJury}
        />
      </section>

      {/* Ranking */}
      <section aria-labelledby="ranking" className="mt-10 space-y-4">
        <SectionTitle id="ranking">Ranking dos pratos</SectionTitle>
        <VoteMetricsTabs
          combinedRanking={ranking}
          publicRanking={publicRanking}
          juryRanking={juryRanking}
        />
      </section>

      {/* Detalhamento */}
      <section aria-labelledby="detalhamento" className="mt-10 space-y-4">
        <SectionTitle id="detalhamento">Detalhamento por categoria</SectionTitle>
        <DishCategoryTable rows={categoryDetailedData} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DishCategoryComparisonChart rows={categoryDetailedData} />

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-display text-xl tracking-tight">
              Médias por categoria
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Nota média por critério avaliativo (todos os pratos).
            </p>
            <CategoryAveragesChart
              rows={(categoryAvgRows ?? []) as DishCategoryAvgRow[]}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </h2>
  );
}
