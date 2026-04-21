"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import type { Voter } from "@/lib/supabase/types";
import { formatCPF, formatPhone } from "@/lib/cpf";
import { deleteVoter } from "./actions";

export function VotersTable({ voters }: { voters: Voter[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const toDelete = voters.find((v) => v.id === confirmId) ?? null;

  const handleDelete = async () => {
    if (!confirmId) return;
    setPendingId(confirmId);
    const res = await deleteVoter(confirmId);
    setPendingId(null);
    setConfirmId(null);
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Votante excluído", variant: "success" });
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="outline" asChild>
          <a href="/admin/votantes/export">
            <Download className="h-4 w-4" />
            Exportar votantes (Excel)
          </a>
        </Button>
      </div>

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
              <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Excluir ${v.name}`}
                    onClick={() => setConfirmId(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmId !== null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir votante?</DialogTitle>
            <DialogDescription>
              {toDelete ? (
                <>
                  O cadastro de <strong>{toDelete.name}</strong> será removido. Todas as
                  avaliações feitas por este votante no público também serão apagadas. Esta
                  ação não pode ser desfeita.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pendingId !== null}
              onClick={handleDelete}
            >
              {pendingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo…
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
