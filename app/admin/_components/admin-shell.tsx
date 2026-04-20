"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ListChecks,
  Users,
  Vote,
  UserCog,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SiteLogo } from "@/components/site-logo";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pratos", label: "Pratos", icon: UtensilsCrossed },
  { href: "/admin/categorias", label: "Categorias", icon: ListChecks },
  { href: "/admin/votantes", label: "Votantes", icon: Users },
  { href: "/admin/votos", label: "Avaliações", icon: Vote },
  { href: "/admin/jurados", label: "Jurados", icon: UserCog },
];

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

function getInitials(name: string, fallback: string) {
  const source = (name || fallback || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminShell({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (v === "1") setSidebarCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = React.useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const initials = getInitials(userName, userEmail);

  return (
    <div className="min-h-screen min-w-0 bg-muted/30">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:h-16 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-muted ss-focus"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <SiteLogo height={30} className="max-h-8 sm:hidden" />
          <SiteLogo height={32} className="hidden max-h-9 sm:block" />
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
          {initials}
        </div>
      </header>

      <div className="flex min-w-0">
        {/* Sidebar desktop — recolhível */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-[width] duration-300 ease-in-out md:flex",
            sidebarCollapsed ? "w-[4.5rem]" : "w-64 lg:w-72",
          )}
        >
          <SidebarInner
            pathname={pathname}
            userName={userName}
            userEmail={userEmail}
            initials={initials}
            onLogout={handleLogout}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setCollapsed(!sidebarCollapsed)}
            variant="desktop"
          />
        </aside>

        {/* Drawer mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <button
              type="button"
              className="absolute inset-0 bg-foreground/50 backdrop-blur-sm animate-fade-in"
              aria-label="Fechar menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-[min(20rem,calc(100vw-2.5rem))] max-w-[85vw] flex-col border-r border-border bg-background shadow-elevated animate-slide-in-left">
              <div className="flex items-center justify-between border-b border-border p-3">
                <SiteLogo height={32} />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-muted ss-focus"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarInner
                pathname={pathname}
                userName={userName}
                userEmail={userEmail}
                initials={initials}
                onLogout={handleLogout}
                onNavigate={() => setMobileMenuOpen(false)}
                hideHeader
                variant="mobile"
              />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-5 sm:py-7 md:px-8 md:py-9 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

type SidebarVariant = "desktop" | "mobile";

function SidebarInner({
  pathname,
  userName,
  userEmail,
  initials,
  onLogout,
  onNavigate,
  hideHeader,
  collapsed,
  onToggleCollapse,
  variant = "desktop",
}: {
  pathname: string;
  userName: string;
  userEmail: string;
  initials: string;
  onLogout: () => void;
  onNavigate?: () => void;
  hideHeader?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  variant?: SidebarVariant;
}) {
  const isCollapsed = variant === "desktop" && collapsed;

  return (
    <>
      {!hideHeader && (
        <div
          className={cn(
            "flex border-b border-border p-3 sm:p-4",
            isCollapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between gap-2",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              isCollapsed && "flex-col justify-center",
            )}
          >
            {isCollapsed ? (
              <SiteLogo height={36} />
            ) : (
              <>
                <SiteLogo height={36} />
                <div className="min-w-0 leading-tight">
                  <p className="font-display text-lg tracking-tight">Admin</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Canaã Gastronomia
                  </p>
                </div>
              </>
            )}
          </div>
          {variant === "desktop" && onToggleCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}

      <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto ss-scroll p-2 sm:p-3">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ss-focus",
                isCollapsed && "justify-center px-2",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {active && !isCollapsed && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-brand"
                />
              )}
              {active && isCollapsed && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn(isCollapsed && "sr-only")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "border-t border-border p-2 sm:p-3",
          isCollapsed && "flex flex-col items-center gap-2",
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-center gap-3 rounded-xl bg-muted/60 p-2",
            isCollapsed && "mb-0 flex-col gap-1 p-1.5",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 text-xs leading-tight">
              <p className="truncate font-medium text-foreground">{userName}</p>
              <p className="truncate text-muted-foreground">{userEmail}</p>
            </div>
          )}
        </div>
        {isCollapsed && (
          <span className="sr-only">
            {userName}, {userEmail}
          </span>
        )}
        <Button
          variant="ghost"
          className={cn("w-full justify-start", isCollapsed && "justify-center px-0")}
          onClick={onLogout}
          title="Sair"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(isCollapsed && "sr-only")}>Sair</span>
        </Button>
      </div>
    </>
  );
}
