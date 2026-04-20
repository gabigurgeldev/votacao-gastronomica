"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScoreInput } from "@/components/ui/score-input";
import type { Category } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { submitJuryVote } from "./actions";

export function JuryVoteForm({
  dishId,
  categories,
  initialScores,
}: {
  dishId: string;
  categories: Category[];
  initialScores: Record<string, number>;
}) {
  const router = useRouter();
  const [scores, setScores] = React.useState<Record<string, number>>(initialScores);
  const [submitting, setSubmitting] = React.useState(false);
  const hasExisting = Object.keys(initialScores).length > 0;

  const allRated =
    categories.length > 0 &&
    categories.every((c) => typeof scores[c.id] === "number");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitJuryVote({
      dishId,
      scores: categories.map((c) => ({ categoryId: c.id, score: scores[c.id] })),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: hasExisting ? "Avaliação atualizada" : "Avaliação registrada",
      variant: "success",
    });
    router.push("/jurado/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="ss-card p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl tracking-tight">
          {hasExisting ? "Revisar avaliação" : "Avaliar prato"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dê uma nota de 5 a 10 para cada critério.
        </p>
        {hasExisting && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="h-3 w-3" />
            Você já avaliou este prato — pode atualizar as notas.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {categories.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <Label>{cat.name}</Label>
              {typeof scores[cat.id] === "number" && (
                <span className="text-xs font-medium text-brand">
                  {scores[cat.id]}/10
                </span>
              )}
            </div>
            {cat.description && (
              <p className="text-xs text-muted-foreground">{cat.description}</p>
            )}
            <ScoreInput
              value={scores[cat.id] ?? null}
              onChange={(v) => setScores((prev) => ({ ...prev, [cat.id]: v }))}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          type="button"
          onClick={() => router.push("/jurado/dashboard")}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={!allRated || submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : hasExisting ? (
            "Atualizar avaliação"
          ) : (
            "Registrar avaliação"
          )}
        </Button>
      </div>
    </form>
  );
}
