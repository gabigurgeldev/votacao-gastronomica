"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Niche } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { createNiche, deleteNiche, updateNiche } from "./actions";

export function NichesManager({ initialNiches }: { initialNiches: Niche[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Niche | null>(null);
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (n: Niche) => {
    setEditing(n);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este nicho? Empresas e votos relacionados serão removidos.")) {
      return;
    }
    const res = await deleteNiche(id);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Nicho excluído", variant: "success" });
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = editing
      ? await updateNiche(editing.id, fd)
      : await createNiche(fd);
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: editing ? "Nicho atualizado" : "Nicho criado",
      variant: "success",
    });
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Novo nicho
        </Button>
      </div>

      {initialNiches.length === 0 ? (
        <div className="ss-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Utensils className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-lg">Nenhum nicho cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Clique em &ldquo;Novo nicho&rdquo; para começar.
          </p>
        </div>
      ) : (
        <div className="ss-card divide-y divide-border/70 overflow-hidden">
          {initialNiches.map((n) => (
            <div key={n.id} className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-sm font-semibold text-brand">
                {n.display_order}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{n.name}</h3>
                  {!n.active && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inativo
                    </Badge>
                  )}
                </div>
                {n.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {n.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(n)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(n.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar nicho" : "Novo nicho"}</DialogTitle>
            <DialogDescription>
              O nicho aparece na home pública. Empresas são vinculadas em &ldquo;Empresas&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description ?? ""}
                placeholder="Breve descrição do nicho"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="display_order">Ordem</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  min={0}
                  defaultValue={editing?.display_order ?? 0}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={editing?.active ?? true}
                    className="h-4 w-4 rounded border-border accent-brand"
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
