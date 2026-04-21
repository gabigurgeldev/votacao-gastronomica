import { Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Voter } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "../../_components/page-header";
import { VotersTable } from "./voters-table";

export const dynamic = "force-dynamic";

export default async function VotersPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("voters")
    .select("*")
    .order("created_at", { ascending: false });

  const voters = (data ?? []) as Voter[];

  return (
    <>
      <PageHeader
        title="Votantes cadastrados"
        description={`${voters.length} ${voters.length === 1 ? "pessoa se cadastrou" : "pessoas se cadastraram"} para avaliar (público).`}
      />

      {voters.length === 0 ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" asChild>
              <a href="/admin/votantes/export">
                <Download className="h-4 w-4" />
                Exportar votantes (Excel)
              </a>
            </Button>
          </div>
          <div className="ss-card p-12 text-center text-sm text-muted-foreground">
            Nenhum votante cadastrado ainda.
          </div>
        </>
      ) : (
        <VotersTable voters={voters} />
      )}
    </>
  );
}
