"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { deleteVote } from "./actions";

interface VoteRow {
  id: string;
  voter_type: "public" | "jury";
  created_at: string;
  dish_id: string;
  dishes: { id: string; name: string } | null;
  voters: { name: string | null; email: string | null } | null;
  jury_user_id: string | null;
  vote_scores: { category_id: string; score: number; categories: { name: string } | null }[];
}

export function VotesExplorer({
  votes,
  dishes,
  juryNames,
  filter,
}: {
  votes: VoteRow[];
  dishes: { id: string; name: string }[];
  juryNames: Record<string, string>;
  filter: { type: string; dish: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const voteToDelete = votes.find((v) => v.id === confirmId) ?? null;

  const handleDeleteVote = async () => {
    if (!confirmId) return;
    setPendingId(confirmId);
    const res = await deleteVote(confirmId);
    setPendingId(null);
    setConfirmId(null);
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Avaliação excluída", variant: "success" });
    router.refresh();
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`/admin/votos?${params.toString()}`);
  };

  return (
    <>
      <div className="ss-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </label>
          <select
            value={filter.type}
            onChange={(e) => setParam("type", e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm ss-focus"
          >
            <option value="all">Todos</option>
            <option value="public">Público</option>
            <option value="jury">Jurados</option>
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prato
          </label>
          <select
            value={filter.dish}
            onChange={(e) => setParam("dish", e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm ss-focus"
          >
            <option value="all">Todos os pratos</option>
            {dishes.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {votes.length === 0 ? (
        <div className="ss-card p-12 text-center text-sm text-muted-foreground">
          Nenhuma avaliação encontrada com esses filtros.
        </div>
      ) : (
        <div className="ss-card divide-y divide-border/70 overflow-hidden">
          {votes.map((v) => {
            const avg =
              v.vote_scores.length > 0
                ? v.vote_scores.reduce((s, x) => s + Number(x.score), 0) / v.vote_scores.length
                : 0;
            const who =
              v.voter_type === "public"
                ? v.voters?.name ?? "Anônimo"
                : juryNames[v.jury_user_id ?? ""] ?? "Jurado";
            return (
              <div
                key={v.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted px-2 py-2">
                  <span className="font-display text-2xl leading-none">
                    {avg.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">média</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={v.voter_type === "jury" ? "default" : "secondary"}
                      className="text-[10px] uppercase"
                    >
                      {v.voter_type === "jury" ? "Jurado" : "Público"}
                    </Badge>
                    <span className="truncate font-medium">
                      {v.dishes?.name ?? "Prato"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    Por: {who} ·{" "}
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.vote_scores.map((s) => (
                      <span
                        key={s.category_id}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {s.categories?.name ?? ""}:
                        </span>
                        <span className="font-semibold">{s.score}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 justify-end sm:items-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Excluir avaliação"
                    onClick={() => setConfirmId(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir avaliação?</DialogTitle>
            <DialogDescription>
              {voteToDelete ? (
                <>
                  Esta avaliação de{" "}
                  <strong>{voteToDelete.dishes?.name ?? "prato"}</strong> será removida
                  permanentemente, incluindo todas as notas por critério. Esta ação não pode ser
                  desfeita.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendingId !== null}
              onClick={handleDeleteVote}
            >
              {pendingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo…
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
