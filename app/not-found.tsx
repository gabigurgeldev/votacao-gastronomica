import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="ss-hero-gradient flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          Página não encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          O conteúdo que você tentou acessar não existe ou foi movido.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </main>
  );
}
