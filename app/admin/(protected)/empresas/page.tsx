import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Company, Niche } from "@/lib/supabase/types";
import { PageHeader } from "../../_components/page-header";
import { CompaniesManager } from "./companies-manager";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: companies }, { data: niches }] = await Promise.all([
    supabase
      .from("companies")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("niches")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Cadastre as empresas concorrentes em cada nicho. Logo + nome são exibidos no popup público."
      />
      <CompaniesManager
        initialCompanies={(companies ?? []) as Company[]}
        niches={(niches ?? []) as Niche[]}
      />
    </>
  );
}
