import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Niche } from "@/lib/supabase/types";
import { PageHeader } from "../../_components/page-header";
import { NichesManager } from "./niches-manager";

export const dynamic = "force-dynamic";

export default async function AdminNichesPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("niches")
    .select("*")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <>
      <PageHeader
        title="Nichos"
        description="Defina os nichos exibidos na página pública. Cada nicho agrupa empresas concorrentes."
      />
      <NichesManager initialNiches={(data ?? []) as Niche[]} />
    </>
  );
}
