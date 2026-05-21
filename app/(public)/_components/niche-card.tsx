"use client";

import * as React from "react";
import { Utensils, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Niche } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/components/theme-provider";

interface NicheCardProps {
  niche: Niche;
  voted?: boolean;
  companyCount: number;
  onClick: () => void;
}

export function NicheCard({ niche, voted, companyCount, onClick }: NicheCardProps) {
  const settings = useSiteSettings();
  const cardStyle = settings.card_style ?? "glass";

  const styleClasses = {
    glass: "border-border/60 bg-card/60 backdrop-blur-md shadow-soft hover:shadow-brand hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:shadow-brand",
    flat: "border-2 border-foreground bg-card shadow-none hover:-translate-y-0.5 hover:bg-muted/10 focus-visible:-translate-y-0.5",
    elevated: "border-border/70 bg-card shadow-card hover:shadow-elevated hover:-translate-y-1.5 hover:scale-[1.01] focus-visible:-translate-y-1.5 focus-visible:scale-[1.01]"
  }[cardStyle];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl p-6 text-left border transition-all duration-300 ss-focus",
        styleClasses,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Utensils className="h-7 w-7" />
        </div>
        {voted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-soft">
            <CheckCircle2 className="h-3 w-3" />
            Votado
          </span>
        )}
      </div>

      <h3 className="mt-4 font-display text-xl leading-tight tracking-tight sm:text-2xl">
        {niche.name}
      </h3>
      {niche.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {niche.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-sm">
        <span className="text-muted-foreground">
          {companyCount === 0
            ? "Sem empresas"
            : `${companyCount} ${companyCount === 1 ? "empresa" : "empresas"}`}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-brand transition-transform group-hover:gap-2">
          {voted ? "Ver" : "Votar"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
