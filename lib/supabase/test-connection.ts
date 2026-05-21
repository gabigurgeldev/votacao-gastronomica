"use server";

import { createSupabaseServerClient } from "./server";

export async function testSupabaseConnection() {
  try {
    const supabase = createSupabaseServerClient();

    const { error: nichesError } = await supabase
      .from("niches")
      .select("id", { count: "exact", head: true });

    if (nichesError) {
      return {
        ok: false,
        error: `Erro na tabela niches: ${nichesError.message}`,
        code: nichesError.code,
      };
    }

    const { error: companiesError } = await supabase
      .from("companies")
      .select("id", { count: "exact", head: true });

    if (companiesError) {
      return {
        ok: false,
        error: `Erro na tabela companies: ${companiesError.message}`,
        code: companiesError.code,
      };
    }

    return {
      ok: true,
      message: "Conexão com Supabase OK!",
    };
  } catch (err) {
    return {
      ok: false,
      error: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}`,
      code: "EXCEPTION",
    };
  }
}
