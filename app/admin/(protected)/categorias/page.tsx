import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/supabase/types";
import { PageHeader } from "../../_components/page-header";
import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <>
      <PageHeader
        title="Categorias de avaliação"
        description="Defina os critérios que aparecem no popup de votação. As ativas serão obrigatórias."
      />
      <CategoriesManager initialCategories={(data ?? []) as Category[]} />
    </>
  );
}
