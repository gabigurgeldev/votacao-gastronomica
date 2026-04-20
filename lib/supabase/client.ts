"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o browser.
 * Usa @supabase/ssr para sincronizar a sessão via cookies, garantindo
 * que o middleware e Server Components no Next.js enxerguem o usuário
 * autenticado imediatamente após o login.
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configurados no .env.local",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
