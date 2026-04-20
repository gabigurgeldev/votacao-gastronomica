"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatAvg } from "@/lib/utils";
import type { DishCategoryDetailedRow } from "@/lib/supabase/types";

type ViewMode = "combined" | "split";

interface DishCategoryTableProps {
  rows: DishCategoryDetailedRow[];
}

interface DishWithCategories {
  dish_id: string;
  dish_name: string;
  image_url: string | null;
  categories: {
    category_id: string;
    category_name: string;
    avg_score_overall: number | null;
    avg_score_public: number | null;
    avg_score_jury: number | null;
    total_scores_public: number;
    total_scores_jury: number;
  }[];
  overall_avg: number | null;
}

export function DishCategoryTable({ rows }: DishCategoryTableProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");

  const dishesById = React.useMemo(() => {
    const map = new Map<string, DishWithCategories>();

    for (const row of rows) {
      if (!map.has(row.dish_id)) {
        map.set(row.dish_id, {
          dish_id: row.dish_id,
          dish_name: row.dish_name,
          image_url: row.image_url,
          categories: [],
          overall_avg: null,
        });
      }
      const dish = map.get(row.dish_id)!;
      dish.categories.push({
        category_id: row.category_id,
        category_name: row.category_name,
        avg_score_overall: row.avg_score_overall,
        avg_score_public: row.avg_score_public,
        avg_score_jury: row.avg_score_jury,
        total_scores_public: row.total_scores_public,
        total_scores_jury: row.total_scores_jury,
      });
    }

    for (const dish of map.values()) {
      const validScores = dish.categories
        .map((c) => c.avg_score_overall)
        .filter((s): s is number => s != null);
      if (validScores.length > 0) {
        dish.overall_avg =
          validScores.reduce((a, b) => a + b, 0) / validScores.length;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => (b.overall_avg ?? 0) - (a.overall_avg ?? 0),
    );
  }, [rows]);

  if (dishesById.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ainda não há dados de avaliação por categoria.
        </p>
      </div>
    );
  }

  const categoryNames = dishesById[0]?.categories.map((c) => c.category_name) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        <div className="min-w-0">
          <h3 className="font-display text-xl tracking-tight">
            Avaliação por categoria
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notas médias por critério ({categoryNames.length}{" "}
            {categoryNames.length === 1 ? "categoria" : "categorias"})
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1 sm:self-start">
          <button
            onClick={() => setViewMode("split")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ss-focus sm:flex-initial",
              viewMode === "split"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Público + Jurado
          </button>
          <button
            onClick={() => setViewMode("combined")}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ss-focus sm:flex-initial",
              viewMode === "combined"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Combinado
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="ss-scroll hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="sticky left-0 z-[1] border-b border-border bg-muted/40 py-3 pl-6 pr-4 text-left font-medium text-muted-foreground">
                Prato
              </th>
              {categoryNames.map((name) => (
                <th
                  key={name}
                  className="border-b border-border py-3 px-2 text-center font-medium text-muted-foreground"
                >
                  {viewMode === "split" ? (
                    <div className="flex flex-col gap-1">
                      <span>{name}</span>
                      <div className="flex gap-1 text-[10px] uppercase">
                        <span className="flex-1 text-brand">Pub</span>
                        <span className="flex-1 text-accent">Jur</span>
                      </div>
                    </div>
                  ) : (
                    name
                  )}
                </th>
              ))}
              <th className="border-b border-border py-3 pl-4 pr-6 text-right font-medium text-muted-foreground">
                Média Geral
              </th>
            </tr>
          </thead>
          <tbody>
            {dishesById.map((dish) => (
              <tr key={dish.dish_id} className="transition-colors hover:bg-muted/30">
                <td className="border-b border-border/70 py-3 pl-6 pr-4">
                  <span className="font-medium">{dish.dish_name}</span>
                </td>
                {dish.categories.map((cat) => (
                  <td
                    key={cat.category_id}
                    className="border-b border-border/70 py-3 px-2 text-center"
                  >
                    {viewMode === "split" ? (
                      <div className="flex gap-1">
                        <span
                          className={cn(
                            "flex-1 rounded-md px-1 py-0.5 text-xs font-medium",
                            cat.avg_score_public != null
                              ? "bg-brand/10 text-brand"
                              : "bg-muted text-muted-foreground",
                          )}
                          title={`Público: ${cat.total_scores_public} avaliações`}
                        >
                          {formatAvg(cat.avg_score_public)}
                        </span>
                        <span
                          className={cn(
                            "flex-1 rounded-md px-1 py-0.5 text-xs font-medium",
                            cat.avg_score_jury != null
                              ? "bg-accent/10 text-accent"
                              : "bg-muted text-muted-foreground",
                          )}
                          title={`Jurados: ${cat.total_scores_jury} avaliações`}
                        >
                          {formatAvg(cat.avg_score_jury)}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                          cat.avg_score_overall != null
                            ? "bg-brand/10 text-brand"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {formatAvg(cat.avg_score_overall)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="border-b border-border/70 py-3 pl-4 pr-6 text-right">
                  <span className="font-display text-lg font-semibold">
                    {formatAvg(dish.overall_avg)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack */}
      <div className="flex flex-col gap-3 p-5 md:hidden">
        {dishesById.map((dish) => (
          <div
            key={dish.dish_id}
            className="rounded-xl border border-border bg-background/50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate font-medium">{dish.dish_name}</p>
              <span className="font-display text-xl font-semibold leading-none">
                {formatAvg(dish.overall_avg)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {dish.categories.map((cat) => (
                <div
                  key={cat.category_id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {cat.category_name}
                  </span>
                  {viewMode === "split" ? (
                    <div className="flex gap-1.5 text-xs">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-medium",
                          cat.avg_score_public != null
                            ? "bg-brand/10 text-brand"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        Pub {formatAvg(cat.avg_score_public)}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-medium",
                          cat.avg_score_jury != null
                            ? "bg-accent/10 text-accent"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        Jur {formatAvg(cat.avg_score_jury)}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        cat.avg_score_overall != null
                          ? "bg-brand/10 text-brand"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {formatAvg(cat.avg_score_overall)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
