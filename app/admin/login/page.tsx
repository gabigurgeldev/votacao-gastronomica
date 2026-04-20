import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "./login-form";
import { SiteLogo } from "@/components/site-logo";

export const metadata = {
  title: "Entrar",
};

export default function AdminLoginPage() {
  return (
    <main className="ss-hero-gradient-strong relative flex min-h-screen flex-col overflow-hidden">
      <header className="container flex items-center justify-between py-5 sm:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm text-muted-foreground shadow-soft backdrop-blur transition-colors hover:text-foreground ss-focus"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao evento
        </Link>
      </header>

      <div className="container flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated ring-1 ring-border/70 sm:p-10">
            <div className="mb-8 flex flex-col items-center gap-4 text-center">
              <SiteLogo height={60} priority className="hidden sm:block" />
              <SiteLogo height={48} priority className="sm:hidden" />
              <div>
                <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
                  Entrar no sistema
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Administradores e jurados acessam por aqui.
                </p>
              </div>
            </div>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Problemas para entrar? Fale com um administrador do evento.
          </p>
        </div>
      </div>
    </main>
  );
}
