import Link from "next/link";
import Image from "next/image";
import {
  ChefHat,
  CheckCircle2,
  CircleDashed,
  ArrowRight,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Dish } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "pending" | "done";

export default async function JuryDashboard({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  const juryId = user.user?.id;

  const [{ data: dishes }, { data: myVotes }] = await Promise.all([
    supabase
      .from("dishes")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true }),
    juryId
      ? supabase
          .from("votes")
          .select("dish_id")
          .eq("voter_type", "jury")
          .eq("jury_user_id", juryId)
      : Promise.resolve({ data: [] as { dish_id: string }[] }),
  ]);

  const votedSet = new Set((myVotes ?? []).map((v) => v.dish_id));
  const all = (dishes ?? []) as Dish[];
  const totalDone = all.filter((d) => votedSet.has(d.id)).length;
  const pending = all.length - totalDone;
  const progressPct = all.length > 0 ? Math.round((totalDone / all.length) * 100) : 0;

  const rawFilter = searchParams?.filter ?? "all";
  const filter: FilterKey =
    rawFilter === "pending" || rawFilter === "done" ? rawFilter : "all";

  const filteredDishes =
    filter === "pending"
      ? all.filter((d) => !votedSet.has(d.id))
      : filter === "done"
        ? all.filter((d) => votedSet.has(d.id))
        : all;

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: all.length },
    { key: "pending", label: "Pendentes", count: pending },
    { key: "done", label: "Avaliados", count: totalDone },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Área do jurado
        </span>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl md:text-5xl">
          Avalie os pratos
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Dê uma nota de 5 a 10 em cada critério para cada prato. Suas avaliações
          ficam separadas das avaliações do público.
        </p>
      </div>

      {all.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Seu progresso
              </p>
              <p className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">
                {totalDone} de {all.length}{" "}
                <span className="text-base font-sans font-normal text-muted-foreground">
                  {all.length === 1 ? "prato" : "pratos"} avaliado
                  {totalDone === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <div className="flex items-baseline gap-2 sm:flex-col sm:items-end">
              <span className="font-display text-3xl tracking-tight">
                {progressPct}%
              </span>
              {pending > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Faltam {pending} {pending === 1 ? "prato" : "pratos"}
                </span>
              ) : (
                <span className="text-xs font-medium text-success">
                  Tudo avaliado!
                </span>
              )}
            </div>
          </div>
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso das avaliações"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Filtros */}
          <div className="ss-scroll mt-5 -mx-1 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
            {filters.map((f) => {
              const active = f.key === filter;
              return (
                <Link
                  key={f.key}
                  href={
                    f.key === "all"
                      ? "/jurado/dashboard"
                      : `/jurado/dashboard?filter=${f.key}`
                  }
                  scroll={false}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ss-focus",
                    active
                      ? "bg-background text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      active
                        ? "bg-brand/10 text-brand"
                        : "bg-background/60 text-muted-foreground",
                    )}
                  >
                    {f.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {all.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ChefHat className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-display text-lg tracking-tight">
            Nenhum prato cadastrado
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            O administrador ainda não publicou pratos para avaliação.
          </p>
        </div>
      ) : filteredDishes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">
          {filter === "pending"
            ? "Todos os pratos já foram avaliados por você. Parabéns!"
            : "Você ainda não avaliou nenhum prato."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDishes.map((d) => {
            const voted = votedSet.has(d.id);
            return (
              <Link
                key={d.id}
                href={`/jurado/votar/${d.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-brand ss-focus"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {d.image_url ? (
                    <Image
                      src={d.image_url}
                      alt={d.name}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ChefHat className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    {voted ? (
                      <Badge
                        variant="success"
                        className="gap-1 shadow-elevated"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Avaliado
                      </Badge>
                    ) : (
                      <Badge
                        variant="warning"
                        className="gap-1 bg-accent/20 shadow-elevated"
                      >
                        <CircleDashed className="h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
                  <h3 className="font-display text-lg leading-tight tracking-tight sm:text-xl">
                    {d.name}
                  </h3>
                  {d.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {d.description}
                    </p>
                  )}
                  <p className="mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-transform group-hover:gap-2">
                    {voted ? "Ver / revisar avaliação" : "Avaliar prato"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
