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
              <p className="font-medium text-success">Conexão OK!</p>
              <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-destructive/10 p-4">
              <p className="font-medium text-destructive">Erro de conexão</p>
              <p className="mt-1 text-sm text-destructive/80">{result.error}</p>
              {"code" in result && result.code && (
                <p className="mt-1 text-xs text-muted-foreground">code: {result.code}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
