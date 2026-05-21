import type { CSSProperties } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Vote as VoteIcon } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/supabase/settings";
import type { Company, Niche, Vote } from "@/lib/supabase/types";
import { SiteLogo } from "@/components/site-logo";
import { NicheGrid } from "./_components/niche-grid";
import { AuthCorner } from "./_components/auth-corner";
import { HeroVisual } from "./_components/hero-visual";
import { HowItWorks } from "./_components/how-it-works";

export const dynamic = "force-dynamic";

function renderHeadline(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <span key={i} className="ss-text-gradient font-bold">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

function getHeroPatternStyle(pattern: string): CSSProperties {
  const style: CSSProperties = {};
  if (pattern === "dots") {
    style.backgroundImage = `radial-gradient(hsl(var(--brand) / 0.12) 1.5px, transparent 1.5px)`;
    style.backgroundSize = "24px 24px";
  } else if (pattern === "grid") {
    style.backgroundImage = `
      linear-gradient(to right, hsl(var(--brand) / 0.06) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--brand) / 0.06) 1px, transparent 1px)
    `;
    style.backgroundSize = "40px 40px";
  } else if (pattern === "waves") {
    style.backgroundImage = `
      radial-gradient(circle at 50% 120%, hsl(var(--brand) / 0.06) 10%, transparent 40%),
      radial-gradient(circle at 0% 0%, hsl(var(--accent) / 0.04) 20%, transparent 50%)
    `;
    style.backgroundSize = "100% 100%";
  }
  return style;
}

const HERO_FEATURE_ICONS = [VoteIcon, ShieldCheck, Sparkles] as const;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const settings = await getSiteSettings();
  const patternStyle = getHeroPatternStyle(settings.hero_pattern ?? "dots");
  const heroFeatures = [
    settings.hero_feature_1,
    settings.hero_feature_2,
    settings.hero_feature_3,
  ];
  const showHeroVisual = settings.hero_visual !== "minimal";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let userName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    userName = profile?.name ?? (user.user_metadata?.name as string) ?? null;
  }

  const [{ data: niches }, { data: companies }, votesResult] = await Promise.all([
    supabase
      .from("niches")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("companies")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    user
      ? supabase
          .from("votes")
          .select("*")
          .eq("voter_user_id", user.id)
      : Promise.resolve({ data: [] as Vote[] }),
  ]);

  const nichesData = (niches ?? []) as Niche[];
  const companiesData = (companies ?? []) as Company[];
  const votesData = (votesResult?.data ?? []) as Vote[];
  const nicheCount = nichesData.length;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-16 items-center justify-between gap-3 md:h-20">
          <Link
            href="/"
            aria-label={settings.site_name}
            className="flex items-center gap-3 rounded-lg ss-focus"
          >
            <SiteLogo slot="site" height={40} priority className="md:hidden" />
            <SiteLogo slot="site" height={48} priority className="hidden md:block" />
            {settings.header_sponsor_text ? (
              <>
                <span aria-hidden className="h-8 w-px bg-border" />
                <span
                  className="max-w-[150px] truncate text-xs font-semibold text-muted-foreground md:max-w-xs md:text-sm"
                  title={settings.header_sponsor_text}
                >
                  {settings.header_sponsor_text}
                </span>
              </>
            ) : settings.logo_event_url ? (
              <>
                <span aria-hidden className="h-8 w-px bg-border" />
                <SiteLogo slot="event" height={36} className="md:hidden" />
                <SiteLogo slot="event" height={44} className="hidden md:block" />
              </>
            ) : null}
          </Link>
          <AuthCorner userName={userName} userEmail={user?.email ?? null} />
        </div>
      </header>

      <section className="ss-hero-gradient-strong relative overflow-hidden">
        {settings.hero_pattern !== "none" && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
            style={patternStyle}
          />
        )}

        <div className="container relative py-16 sm:py-20 md:py-24 lg:py-28">
          <div
            className={
              showHeroVisual
                ? "grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12"
                : "flex max-w-3xl flex-col items-start gap-5"
            }
          >
            <div className="flex flex-col items-start gap-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                {settings.hero_badge_text}
              </span>
              <h1 className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                {renderHeadline(settings.headline)}
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                {settings.subheadline}
              </p>

              <ul className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                {heroFeatures.map((label, i) => {
                  const Icon = HERO_FEATURE_ICONS[i] ?? VoteIcon;
                  return (
                    <li
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-soft backdrop-blur sm:text-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-brand sm:h-4 sm:w-4" />
                      {label}
                    </li>
                  );
                })}
              </ul>

              {settings.show_stats && (
                <div className="ss-hero-stats mt-4 flex w-full flex-wrap gap-6 sm:flex-nowrap sm:items-center sm:gap-10">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-3xl font-extrabold text-brand tabular-nums sm:text-4xl">
                      {nicheCount}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Categorias / Nichos
                    </span>
                  </div>
                  <span aria-hidden className="hidden h-10 w-px bg-border/60 sm:block" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-3xl font-extrabold text-brand tabular-nums sm:text-4xl">
                      {companiesData.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Empresas Indicadas
                    </span>
                  </div>
                  <span aria-hidden className="hidden h-10 w-px bg-border/60 sm:block" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display text-3xl font-extrabold text-accent tabular-nums sm:text-4xl">
                      100%
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Votação Segura
                    </span>
                  </div>
                </div>
              )}
            </div>

            {showHeroVisual && (
              <div className="w-full lg:justify-self-end">
                <HeroVisual />
              </div>
            )}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="container pb-20 pt-10 sm:pt-14">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
              <VoteIcon className="h-3 w-3" />
              {nicheCount === 0
                ? "Em breve"
                : `${nicheCount} ${nicheCount === 1 ? "nicho" : "nichos"}`}
            </span>
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl md:text-4xl">
              {settings.niches_section_title}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground sm:text-right">
            {settings.niches_section_subtitle}
          </p>
        </div>

        <NicheGrid
          niches={nichesData}
          companies={companiesData}
          votes={votesData}
          isAuthenticated={!!user}
        />
      </section>

      <footer className="border-t border-border bg-muted/40">
        <div className="container flex flex-col items-center gap-6 py-10 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            {settings.logo_footer_url ? (
              <SiteLogo slot="footer" height={36} />
            ) : (
              <SiteLogo slot="site" height={36} />
            )}
            <p className="max-w-md">
              © {new Date().getFullYear()} {settings.site_name}
            </p>
          </div>
          <p className="max-w-lg text-xs leading-relaxed sm:text-sm">
            {settings.footer_text}
          </p>
          <Link
            href="/admin/login"
            aria-label="Área administrativa"
            className="text-xs text-muted-foreground/60 underline-offset-4 opacity-50 transition-opacity hover:text-foreground hover:opacity-100 hover:underline focus-visible:opacity-100 ss-focus"
          >
            Área administrativa
          </Link>
        </div>
      </footer>
    </main>
  );
}
