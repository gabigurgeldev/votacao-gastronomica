import Image from "next/image";
import { ChefHat, Trophy, Medal, Award } from "lucide-react";
import type { DishRankingRow } from "@/lib/supabase/types";
import { formatAvg, cn } from "@/lib/utils";

function medalFor(index: number) {
  if (index === 0) {
    return { Icon: Trophy, className: "text-[hsl(38_92%_48%)] bg-[hsl(38_92%_92%)]" };
  }
  if (index === 1) {
    return { Icon: Medal, className: "text-zinc-500 bg-zinc-100" };
  }
  if (index === 2) {
    return { Icon: Award, className: "text-brand bg-brand/10" };
  }
  return null;
}

export function RankingTable({ rows }: { rows: DishRankingRow[] }) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ainda não há avaliações registradas.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-border/70">
      {rows.map((r, i) => {
        const medal = medalFor(i);
        const pct = r.avg_score_overall
          ? Math.max(0, Math.min(100, (r.avg_score_overall / 10) * 100))
          : 0;

        return (
          <li
            key={r.dish_id}
            className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-2"
          >
            <div className="flex w-7 shrink-0 items-center justify-center">
              {medal ? (
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    medal.className,
                  )}
                  aria-label={`${i + 1}º lugar`}
                >
                  <medal.Icon className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>
              )}
            </div>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
              {r.image_url ? (
                <Image
                  src={r.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ChefHat className="h-5 w-5 text-muted-foreground/60" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{r.dish_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.total_votes}{" "}
                {r.total_votes === 1 ? "avaliação" : "avaliações"}
              </p>
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="font-display text-2xl leading-none tracking-tight">
                {formatAvg(r.avg_score_overall)}
              </span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">
                  Pub: {formatAvg(r.avg_score_public)} · Jur:{" "}
                  {formatAvg(r.avg_score_jury)}
                </span>
                <span className="sm:hidden">de 10,00</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
