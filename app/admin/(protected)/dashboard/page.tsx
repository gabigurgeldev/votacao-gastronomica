import Image from "next/image";
import {
  Users,
  Vote as VoteIcon,
  Utensils,
  Trophy,
  Building2,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import { KpiCard } from "../../_components/kpi-card";
import type { NicheResultRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const [
    { count: nichesCount },
    { count: companiesCount },
    { count: votesCount },
    { data: results },
  ] = await Promise.all([
    supabase
      .from("niches")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase.from("v_niche_company_results").select("*"),
  ]);

  const rows = (results ?? []) as NicheResultRow[];
  const distinctVoters = await supabase
    .from("votes")
    .select("voter_user_id", { count: "exact", head: true });

  // Agrupa por nicho
  const niches = new Map<string, { niche_name: string; companies: NicheResultRow[] }>();
  for (const r of rows) {
    if (!niches.has(r.niche_id)) {
      niches.set(r.niche_id, { niche_name: r.niche_name, companies: [] });
    }
    if (r.company_id) {
      niches.get(r.niche_id)!.companies.push(r);
    }
  }

  // Top empresa global
  const topCompany = [...rows]
    .filter((r) => r.company_id && r.total_votes > 0)
    .sort((a, b) => b.total_votes - a.total_votes)[0];

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Resumo dos votos por nicho e ranking das empresas."
      />

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Votos totais"
            value={String(votesCount ?? 0)}
            icon={<VoteIcon className="h-5 w-5" />}
          />
          <KpiCard
            label="Votantes únicos"
            value={String(distinctVoters.count ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            label="Nichos ativos"
            value={String(nichesCount ?? 0)}
            icon={<Utensils className="h-5 w-5" />}
            accent="accent"
          />
          <KpiCard
            label="Empresas ativas"
            value={String(companiesCount ?? 0)}
            icon={<Building2 className="h-5 w-5" />}
          />
        </div>

        {topCompany && (
          <KpiCard
            label="Líder geral"
            value={String(topCompany.total_votes)}
            sublabel={`${topCompany.company_name} — ${topCompany.niche_name}`}
            icon={<Trophy className="h-5 w-5" />}
            accent="success"
          />
        )}
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ranking por nicho
        </h2>

        {niches.size === 0 ? (
          <div className="ss-card flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Utensils className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-display text-lg">Nenhum nicho cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Crie nichos e empresas para começar a receber votos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[...niches.entries()].map(([nicheId, { niche_name, companies }]) => {
              const sorted = [...companies].sort(
                (a, b) => b.total_votes - a.total_votes,
              );
              const max = Math.max(1, ...sorted.map((c) => c.total_votes));
              return (
                <div key={nicheId} className="ss-card overflow-hidden">
                  <div className="border-b border-border/70 bg-muted/30 px-5 py-3">
                    <h3 className="font-display text-lg">{niche_name}</h3>
                  </div>
                  {sorted.length === 0 ? (
                    <div className="p-5 text-sm text-muted-foreground">
                      Nenhuma empresa cadastrada.
                    </div>
                  ) : (
                    <ul className="divide-y divide-border/70">
                      {sorted.map((c, i) => (
                        <li
                          key={c.company_id ?? i}
                          className="flex items-center gap-3 px-5 py-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                            {i + 1}
                          </span>
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {c.logo_url ? (
                              <Image
                                src={c.logo_url}
                                alt={c.company_name ?? ""}
                                fill
                                sizes="36px"
                                className="object-contain p-1"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {c.company_name ?? "—"}
                            </p>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                  width: `${Math.round((c.total_votes / max) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums">
                            {c.total_votes}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
