"use client";

import * as React from "react";
import Image from "next/image";
import { ChefHat, CheckCircle2, ArrowRight } from "lucide-react";
import type { Dish } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface DishCardProps {
  dish: Dish;
  evaluated?: boolean;
  onClick: () => void;
}

export function DishCard({ dish, evaluated, onClick }: DishCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-soft transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-brand focus-visible:-translate-y-1 focus-visible:shadow-brand ss-focus",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {dish.image_url ? (
          <Image
            src={dish.image_url}
            alt={dish.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ChefHat className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {evaluated && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground shadow-elevated">
            <CheckCircle2 className="h-3 w-3" />
            Avaliado
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-display text-lg leading-tight tracking-tight sm:text-xl">
          {dish.name}
        </h3>
        {dish.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {dish.description}
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-transform group-hover:gap-2">
          {evaluated ? "Ver ou atualizar" : "Avaliar este prato"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
