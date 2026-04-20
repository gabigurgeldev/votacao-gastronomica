"use client";

import * as React from "react";

export default function TestSupabasePage() {
  const [result, setResult] = React.useState<string>("Testando...");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function test() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
          setError("Variáveis de ambiente não configuradas");
          return;
        }

        // Teste simples de fetch
        const response = await fetch(`${url}/auth/v1/settings`, {
          headers: {
            apikey: key,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setResult(`Conexão OK! Status: ${response.status}`);
          console.log("Supabase settings:", data);
        } else {
          setError(`Erro ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    test();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow">
        <h1 className="text-xl font-semibold">Teste Supabase</h1>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">URL:</p>
          <p className="truncate text-sm font-mono">
            {process.env.NEXT_PUBLIC_SUPABASE_URL || "não definida"}
          </p>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Resultado:</p>
          {error ? (
            <p className="mt-1 text-sm text-destructive">{error}</p>
          ) : (
            <p className="mt-1 text-sm text-green-600">{result}</p>
          )}
        </div>
        <a href="/admin/login" className="mt-6 block text-center text-sm text-blue-600 hover:underline">
          Ir para login
        </a>
      </div>
    </main>
  );
}
