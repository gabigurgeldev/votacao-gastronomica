import { testSupabaseConnection } from "@/lib/supabase/test-connection";

export const dynamic = "force-dynamic";

export default async function DiagnosticoPage() {
  const result = await testSupabaseConnection();

  return (
    <main className="ss-hero-gradient flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="ss-card p-8">
          <h1 className="font-display text-2xl tracking-tight">Diagnóstico Supabase</h1>
          
          {result.ok ? (
            <div className="mt-4 rounded-xl bg-success/15 p-4">
              <p className="font-medium text-success">✓ Conexão OK!</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
              <div className="mt-3 text-sm">
                <p>Pratos: {result.dishes}</p>
                <p>Categorias: {result.categories}</p>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Se o site ainda dá "failed to fetch", o problema pode ser:
                <br />1. Browser cache - tente Ctrl+F5
                <br />2. CORS no Supabase - verifique se o projeto está ativo
                <br />3. URL do Supabase incorreta no .env.local
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-destructive/10 p-4">
              <p className="font-medium text-destructive">✗ Erro de conexão</p>
              <p className="mt-1 text-sm">{result.error}</p>
              {result.code && (
                <p className="mt-1 text-xs text-muted-foreground">Código: {result.code}</p>
              )}
              
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">Possíveis causas:</p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  <li>Projeto Supabase foi pausado ou excluído</li>
                  <li>URL ou chaves ANON incorretas no .env.local</li>
                  <li>Migrations ainda não aplicadas (tabelas não existem)</li>
                  <li>Problema de rede/firewall</li>
                </ul>
              </div>
              
              <div className="mt-4 rounded-lg bg-muted p-3 text-xs">
                <p className="font-medium">URL configurada:</p>
                <p className="truncate">{process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex gap-2">
            <a 
              href="/diagnostico" 
              className="flex-1 rounded-xl bg-brand px-4 py-2 text-center text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Testar novamente
            </a>
            <a 
              href="/" 
              className="flex-1 rounded-xl bg-muted px-4 py-2 text-center text-sm font-medium hover:bg-muted/80"
            >
              Voltar ao site
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
