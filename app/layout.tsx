import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
  title: {
    default: "Canaã Gastronomia",
    template: "%s — Canaã Gastronomia",
  },
  description:
    "Canaã dos Carajás — prove os pratos e registre sua avaliação de 5 a 10 em cada critério.",
  icons: {
    icon: "/logo-canaa-gastronomia.png",
    apple: "/logo-canaa-gastronomia.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen bg-background font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
