"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { DishCategoryDetailedRow } from "@/lib/supabase/types";

interface DishCategoryComparisonChartProps {
  rows: DishCategoryDetailedRow[];
}

interface ChartData {
  category: string;
  publico: number | null;
  jurados: number | null;
}

export function DishCategoryComparisonChart({ rows }: DishCategoryComparisonChartProps) {
  const data = React.useMemo<ChartData[]>(() => {
    // Agrupar por categoria e calcular médias globais
    const byCategory = new Map<
      string,
      { publicSum: number; publicCount: number; jurySum: number; juryCount: number }
    >();

    for (const row of rows) {
      if (!byCategory.has(row.category_name)) {
        byCategory.set(row.category_name, {
          publicSum: 0,
          publicCount: 0,
          jurySum: 0,
          juryCount: 0,
        });
      }
      const cat = byCategory.get(row.category_name)!;

      if (row.avg_score_public != null) {
        cat.publicSum += row.avg_score_public * row.total_scores_public;
        cat.publicCount += row.total_scores_public;
      }
      if (row.avg_score_jury != null) {
        cat.jurySum += row.avg_score_jury * row.total_scores_jury;
        cat.juryCount += row.total_scores_jury;
      }
    }

    return Array.from(byCategory.entries()).map(([category, values]) => ({
      category,
      publico:
        values.publicCount > 0
          ? Number((values.publicSum / values.publicCount).toFixed(2))
          : null,
      jurados:
        values.juryCount > 0
          ? Number((values.jurySum / values.juryCount).toFixed(2))
          : null,
    }));
  }, [rows]);

  if (data.length === 0) {
    return (
      <div className="ss-card p-6">
        <h2 className="font-display text-xl tracking-tight">Comparativo por categoria</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Público vs Jurados lado a lado
        </p>
        <p className="py-16 text-center text-sm text-muted-foreground">
          Sem dados suficientes ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="ss-card p-6">
      <h2 className="font-display text-xl tracking-tight">Comparativo por categoria</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Público vs Jurados lado a lado
      </p>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="category"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[5, 10]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderRadius: 12,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => (value === "publico" ? "Público" : "Jurados")}
            />
            <Bar
              dataKey="publico"
              name="publico"
              radius={[8, 8, 0, 0]}
              fill="hsl(var(--brand))"
            />
            <Bar
              dataKey="jurados"
              name="jurados"
              radius={[8, 8, 0, 0]}
              fill="hsl(var(--accent))"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
