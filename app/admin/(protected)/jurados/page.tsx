import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/page-header";
import { JuriesManager, type JuryUser } from "./juries-manager";

export const dynamic = "force-dynamic";

export default async function JuriesPage() {
  const supabase = createSupabaseServerClient();
  
  // Buscar jurados da tabela profiles (mais confiável que app_metadata)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, name, created_at")
    .eq("role", "jurado")
    .order("created_at", { ascending: false });
  
  const juries: JuryUser[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email ?? "",
    name: p.name ?? "",
    created_at: p.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Jurados"
        description="Crie contas com acesso à área do jurado. As avaliações dos jurados ficam separadas das avaliações do público."
      />
      <JuriesManager juries={juries} />
    </>
  );
}
