import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Voter } from "@/lib/supabase/types";
import { PageHeader } from "../../_components/page-header";
import { formatCPF, formatPhone } from "@/lib/cpf";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

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
        <div className="ss-card p-12 text-center text-sm text-muted-foreground">
          Nenhum votante cadastrado ainda.
        </div>
      ) : (
        <div className="ss-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPhone(v.phone)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCPF(v.cpf)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {v.ip_address ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
