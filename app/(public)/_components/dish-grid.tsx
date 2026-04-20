"use client";

import * as React from "react";
import { DishCard } from "./dish-card";
import { VoteDialog } from "./vote-dialog";
import type { Category, Dish } from "@/lib/supabase/types";
import { UtensilsCrossed } from "lucide-react";

const STORAGE_KEY = "public_evaluated_dish_ids";

function readEvaluatedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function DishGrid({
  dishes,
  categories,
}: {
  dishes: Dish[];
  categories: Category[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Dish | null>(null);
  const [evaluatedIds, setEvaluatedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setEvaluatedIds(readEvaluatedIds());
  }, []);

  const markEvaluated = React.useCallback((dishId: string) => {
    setEvaluatedIds((prev) => {
      const next = new Set(prev);
      next.add(dishId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSelect = (dish: Dish) => {
    setSelected(dish);
    setOpen(true);
  };

  const handleSuccess = (dishId: string) => {
    markEvaluated(dishId);
    setOpen(false);
  };

  if (!dishes.length) {
    return (
      <div className="ss-card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <UtensilsCrossed className="h-7 w-7" />
        </div>
        <div className="max-w-sm">
          <h3 className="font-display text-xl tracking-tight">
            Nenhum prato publicado ainda
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que o administrador publicar os pratos, eles aparecem aqui para
            você avaliar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
        {dishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            evaluated={evaluatedIds.has(dish.id)}
            onClick={() => handleSelect(dish)}
          />
        ))}
      </div>

      <VoteDialog
        open={open}
        onOpenChange={setOpen}
        dish={selected}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </>
  );
}
