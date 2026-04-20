import * as React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: "brand" | "accent" | "success" | "warning";
}

export function KpiCard({
  label,
  value,
  sublabel,
  icon,
  accent = "brand",
}: KpiCardProps) {
  const tone = {
    brand: "text-brand bg-brand/10 ring-brand/10",
    accent: "text-accent bg-accent/10 ring-accent/10",
    success: "text-success bg-success/15 ring-success/10",
    warning: "text-[hsl(32_72%_42%)] bg-[hsl(32_92%_92%)] ring-[hsl(32_92%_80%)]/40",
  }[accent];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card",
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
            tone,
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 font-display text-3xl leading-none tracking-tight sm:text-[2rem]">
          {value}
        </span>
        {sublabel && (
          <span className="mt-1.5 truncate text-xs text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
