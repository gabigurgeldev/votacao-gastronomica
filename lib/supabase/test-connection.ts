"use server";

import { createSupabaseServerClient } from "./server";

export async function testSupabaseConnection() {
  try {
    const supabase = createSupabaseServerClient();
    
    // Testa conexão básica
    const { data: dishes, error: dishesError } = await supabase
      .from("dishes")
      .select("count")
      .limit(1);
    
    if (dishesError) {
      return {
        ok: false,
        error: `Erro na tabela dishes: ${dishesError.message}`,
        code: dishesError.code,
      };
    }
    
    // Testa conexão com categorias
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("count")
      .limit(1);
    
    if (catError) {
      return {
        ok: false,
        error: `Erro na tabela categories: ${catError.message}`,
        code: catError.code,
      };
    }
    
    return {
      ok: true,
      message: "Conexão com Supabase OK!",
      dishes: dishes?.length ?? 0,
      categories: categories?.length ?? 0,
    };
  } catch (err) {
    return {
      ok: false,
      error: `Erro de conexão: ${err instanceof Error ? err.message : String(err)}`,
      code: "EXCEPTION",
    };
  }
}
