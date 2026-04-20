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
} from "recharts";
import type { DishCategoryAvgRow } from "@/lib/supabase/types";

export function CategoryAveragesChart({ rows }: { rows: DishCategoryAvgRow[] }) {
  const data = React.useMemo(() => {
    const byCat = new Map<string, { category: string; sum: number; n: number }>();
    for (const r of rows) {
      if (r.avg_score === null) continue;
      const entry = byCat.get(r.category_id);
      const weight = Number(r.total_scores ?? 0);
      if (!weight) continue;
      if (entry) {
        entry.sum += Number(r.avg_score) * weight;
        entry.n += weight;
      } else {
        byCat.set(r.category_id, {
          category: r.category_name,
          sum: Number(r.avg_score) * weight,
          n: weight,
        });
      }
    }
    return Array.from(byCat.values()).map((e) => ({
      category: e.category,
      avg: Number((e.sum / e.n).toFixed(2)),
    }));
  }, [rows]);

  if (!data.length) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Sem dados suficientes ainda.
      </p>
    );
  }

  return (
    <div className="mt-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
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
          <Bar dataKey="avg" radius={[8, 8, 0, 0]} fill="hsl(var(--brand))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
