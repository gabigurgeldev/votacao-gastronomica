"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, LayoutGrid, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SiteLogo } from "@/components/site-logo";
import { cn } from "@/lib/utils";

function initialsOf(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function JuryShell({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const initials = initialsOf(userName, userEmail);
  const dashboardActive = pathname === "/jurado/dashboard" || pathname.startsWith("/jurado/votar");

  return (
    <div className="min-h-screen min-w-0 bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-14 items-center justify-between gap-2 sm:h-16 md:h-[4.25rem]">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted md:hidden ss-focus"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/jurado/dashboard"
              className="flex min-w-0 items-center gap-2 rounded-lg ss-focus sm:gap-3"
            >
              <SiteLogo height={34} priority className="max-h-8 sm:max-h-9 md:hidden" />
              <SiteLogo height={38} priority className="hidden md:block" />
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="font-display text-base tracking-tight sm:text-lg">
                  Painel do Jurado
                </p>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  Canaã Gastronomia
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden max-w-[14rem] text-right text-xs leading-tight lg:block">
              <p className="truncate font-medium">{userName}</p>
              <p className="truncate text-muted-foreground">{userEmail}</p>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand lg:hidden"
              aria-hidden
              title={userName || userEmail}
            >
              {initials}
            </div>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden lg:inline">Evento</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu do jurado"
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(20rem,calc(100vw-2.5rem))] max-w-[90vw] flex-col border-r border-border bg-background shadow-elevated animate-slide-in-left">
            <div className="flex items-center justify-between border-b border-border p-3">
              <SiteLogo height={32} priority />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-muted ss-focus"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto ss-scroll p-3">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Navegação
              </p>
              <Link
                href="/jurado/dashboard"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ss-focus",
                  dashboardActive
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Avaliar pratos
              </Link>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground ss-focus"
              >
                <Home className="h-4 w-4 shrink-0" />
                Página do evento
              </Link>
            </div>

            <div className="border-t border-border p-3">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-xs leading-tight">
                  <p className="truncate font-medium">{userName}</p>
                  <p className="truncate text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start sm:hidden"
                onClick={() => {
                  setMenuOpen(false);
                  void handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      <main className="container min-w-0 overflow-x-hidden py-6 sm:py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
