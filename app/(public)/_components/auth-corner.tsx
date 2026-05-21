"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthDialog } from "./auth-dialog";
import { cn } from "@/lib/utils";

export function AuthCorner({
  userName,
  userEmail,
}: {
  userName: string | null;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  if (!userEmail) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Entrar</span>
        </Button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  const name = userName || userEmail.split("@")[0];
  const initial = (name || "?").trim().slice(0, 1).toUpperCase();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-3 text-sm font-medium shadow-soft transition-colors hover:bg-muted ss-focus",
        )}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover p-1 shadow-elevated"
        >
          <div className="border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate font-medium">{name}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted ss-focus"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
