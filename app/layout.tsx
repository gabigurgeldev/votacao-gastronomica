import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteSettings } from "@/lib/supabase/settings";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const iconUrl = settings.favicon_url
    ? `${settings.favicon_url}?v=${encodeURIComponent(settings.updated_at)}`
    : "/logo-canaa-gastronomia.png";

  return {
    title: {
      default: settings.site_name,
      template: `%s — ${settings.site_name}`,
    },
    description: settings.subheadline,
    icons: {
      icon: iconUrl,
      apple: iconUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();

  return (
    <html lang="pt-BR" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider initialSettings={settings}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
