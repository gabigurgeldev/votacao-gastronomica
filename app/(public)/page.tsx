import Link from "next/link";
import { Sparkles, Star, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Dish } from "@/lib/supabase/types";
import { SiteLogo } from "@/components/site-logo";
import { DishGrid } from "./_components/dish-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const [{ data: dishes }, { data: categories }] = await Promise.all([
    supabase
      .from("dishes")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  const dishCount = dishes?.length ?? 0;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-16 items-center justify-between gap-4 md:h-20">
          <Link
            href="/"
            aria-label="Canaã Gastronomia"
            className="flex items-center gap-3 rounded-lg ss-focus"
          >
            <SiteLogo height={40} priority className="md:hidden" />
            <SiteLogo height={48} priority className="hidden md:block" />
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-brand ss-focus sm:px-4 sm:py-2 sm:text-sm"
          >
            Área do jurado
          </Link>
        </div>
      </header>

      <section className="ss-hero-gradient-strong relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-80px] top-1/2 hidden -translate-y-1/2 text-brand/[0.06] md:block"
        >
          <UtensilsCrossed className="h-[420px] w-[420px]" strokeWidth={0.6} />
        </div>

        <div className="container relative flex flex-col items-start gap-5 py-16 sm:py-20 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Avaliações abertas
          </span>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Prove, sinta e <span className="ss-text-gradient">avalie</span> os melhores pratos da noite.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            Para cada prato, dê uma nota de 5 a 10 em cada critério. Com o mesmo
            cadastro (CPF e e-mail), você pode avaliar quantos pratos quiser — uma
            avaliação por prato.
          </p>

          <ul className="mt-2 flex flex-wrap gap-2 sm:gap-3">
            {[
              { icon: Star, label: "Notas de 5 a 10" },
              { icon: ShieldCheck, label: "Uma avaliação por prato" },
              { icon: Sparkles, label: "Rápido e sem app" },
            ].map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur sm:text-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-brand sm:h-4 sm:w-4" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container pb-20 pt-10 sm:pt-14">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
              <UtensilsCrossed className="h-3 w-3" />
              {dishCount === 0
                ? "Em breve"
                : `${dishCount} ${dishCount === 1 ? "prato" : "pratos"}`}
            </span>
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl md:text-4xl">
              Pratos concorrentes
            </h2>
          </div>
          <p className="text-sm text-muted-foreground sm:text-right">
            Toque em um prato para avaliar
          </p>
        </div>

        <DishGrid
          dishes={(dishes ?? []) as Dish[]}
          categories={(categories ?? []) as Category[]}
        />
      </section>

      <footer className="border-t border-border bg-muted/40">
        <div className="container flex flex-col items-center gap-5 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <SiteLogo height={36} />
            <p>© {new Date().getFullYear()} Canaã Gastronomia — Canaã dos Carajás</p>
          </div>
          <Link
            href="/admin/login"
            aria-label="Área administrativa"
            className="text-xs text-muted-foreground/60 underline-offset-4 opacity-40 transition-opacity hover:text-foreground hover:opacity-100 hover:underline focus-visible:opacity-100 ss-focus"
          >
            Área administrativa
          </Link>
        </div>
      </footer>
    </main>
  );
}
