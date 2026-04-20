"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RankingTable } from "./ranking-table";
import type { DishRankingRow, DishRankingByTypeRow } from "@/lib/supabase/types";

type TabType = "combined" | "public" | "jury";

interface VoteMetricsTabsProps {
  combinedRanking: DishRankingRow[];
  publicRanking: DishRankingByTypeRow[];
  juryRanking: DishRankingByTypeRow[];
}

export function VoteMetricsTabs({
  combinedRanking,
  publicRanking,
  juryRanking,
}: VoteMetricsTabsProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("combined");

  const convertToRankingRow = (rows: DishRankingByTypeRow[]): DishRankingRow[] => {
    return rows.map((r) => ({
      dish_id: r.dish_id,
      dish_name: r.dish_name,
      image_url: r.image_url,
      total_votes: r.total_votes,
      avg_score_overall: r.avg_score,
      avg_score_public: null,
      avg_score_jury: null,
    }));
  };

  const tabs = [
    { id: "combined" as TabType, label: "Combinado", desc: "Média de público + jurados" },
    { id: "public" as TabType, label: "Público", desc: "Apenas avaliações do público" },
    { id: "jury" as TabType, label: "Jurados", desc: "Apenas avaliações dos jurados" },
  ];

  const currentData =
    activeTab === "combined"
      ? combinedRanking
      : activeTab === "public"
        ? convertToRankingRow(publicRanking)
        : convertToRankingRow(juryRanking);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-display text-xl tracking-tight">
              Classificação
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.desc}
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtro de classificação"
            className="ss-scroll -mx-1 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:mx-0"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ss-focus",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2">
          <RankingTable rows={currentData} />
        </div>
      </div>
    </div>
  );
}
