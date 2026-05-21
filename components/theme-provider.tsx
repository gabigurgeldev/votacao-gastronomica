"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SiteSettings } from "@/lib/supabase/types";

type ThemeContextValue = {
  settings: SiteSettings;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useSiteSettings(): SiteSettings {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useSiteSettings deve ser usado dentro de <ThemeProvider>.");
  }
  return ctx.settings;
}

function buildCssVars(s: SiteSettings): string {
  return [
    `--brand: ${s.brand_hsl};`,
    `--brand-foreground: ${s.brand_fg_hsl};`,
    `--brand-soft: ${s.brand_hsl.replace(/(\d+%)$/, "94%")};`,
    `--accent: ${s.accent_hsl};`,
    `--accent-foreground: ${s.accent_fg_hsl};`,
    `--background: ${s.background_hsl};`,
    `--foreground: ${s.foreground_hsl};`,
    `--muted: ${s.muted_hsl};`,
    `--border: ${s.border_hsl};`,
    `--input: ${s.border_hsl};`,
    `--ring: ${s.brand_hsl};`,
  ].join("\n  ");
}

export function ThemeProvider({
  initialSettings,
  children,
}: {
  initialSettings: SiteSettings;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = React.useState<SiteSettings>(initialSettings);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "site_settings",
          filter: "id=eq.1",
        },
        (payload) => {
          if (payload.new) {
            setSettings(payload.new as SiteSettings);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  React.useEffect(() => {
    if (!settings.favicon_url) return;
    const head = document.head;
    const href = `${settings.favicon_url}?v=${encodeURIComponent(settings.updated_at)}`;
    let link = head.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      head.appendChild(link);
    }
    link.href = href;
  }, [settings.favicon_url, settings.updated_at]);

  const css = `:root {\n  ${buildCssVars(settings)}\n}`;

  return (
    <ThemeContext.Provider value={{ settings }}>
      <style
        id="ss-theme-vars"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: css }}
      />
      {children}
    </ThemeContext.Provider>
  );
}
