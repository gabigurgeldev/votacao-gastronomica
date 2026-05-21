"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Company, Niche } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { createCompany, deleteCompany, updateCompany } from "./actions";

export function CompaniesManager({
  initialCompanies,
  niches,
}: {
  initialCompanies: Company[];
  niches: Niche[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Company | null>(null);
  const [open, setOpen] = React.useState(false);

  const nicheById = React.useMemo(() => {
    const map = new Map<string, Niche>();
    niches.forEach((n) => map.set(n.id, n));
    return map;
  }, [niches]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta empresa? Votos relacionados serão removidos.")) {
      return;
    }
    const res = await deleteCompany(id);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Empresa excluída", variant: "success" });
    router.refresh();
  };

  if (niches.length === 0) {
    return (
      <div className="ss-card flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-display text-lg">Cadastre um nicho primeiro</p>
        <p className="text-sm text-muted-foreground">
          Empresas precisam estar vinculadas a um nicho. Vá em &ldquo;Nichos&rdquo; e crie um.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nova empresa
        </Button>
      </div>

      {initialCompanies.length === 0 ? (
        <div className="ss-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-lg">Nenhuma empresa cadastrada</p>
          <p className="text-sm text-muted-foreground">
            Clique em &ldquo;Nova empresa&rdquo; para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialCompanies.map((c) => (
            <div key={c.id} className="ss-card overflow-hidden">
              <div className="relative aspect-video w-full bg-muted">
                {c.logo_url ? (
                  <Image
                    src={c.logo_url}
                    alt={c.name}
                    fill
                    className="object-contain p-4"
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                {!c.active && (
                  <Badge
                    variant="secondary"
                    className="absolute left-3 top-3 bg-background/80 backdrop-blur"
                  >
                    Inativa
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                  {nicheById.get(c.niche_id)?.name ?? "—"}
                </p>
                <h3 className="font-display text-lg leading-tight">{c.name}</h3>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CompanyDialog
        open={open}
        onOpenChange={setOpen}
        company={editing}
        niches={niches}
        onSaved={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function CompanyDialog({
  open,
  onOpenChange,
  company,
  niches,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: Company | null;
  niches: Niche[];
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) setPreviewUrl(null);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = company
      ? await updateCompany(company.id, fd)
      : await createCompany(fd);
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: company ? "Empresa atualizada" : "Empresa criada",
      variant: "success",
    });
    onSaved();
  };

  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto ss-scroll sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {company ? "Editar empresa" : "Nova empresa"}
          </DialogTitle>
          <DialogDescription>
            Vincule a empresa a um nicho. O logo aparece no popup de votação.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="niche_id">Nicho</Label>
            <select
              id="niche_id"
              name="niche_id"
              defaultValue={company?.niche_id ?? niches[0]?.id ?? ""}
              required
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground ss-focus disabled:cursor-not-allowed disabled:opacity-50"
            >
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome da empresa</Label>
            <Input
              id="name"
              name="name"
              defaultValue={company?.name ?? ""}
              required
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
                defaultValue={company?.display_order ?? 0}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={company?.active ?? true}
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                Ativa
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt=""
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : company?.logo_url ? (
                  <Image
                    src={company.logo_url}
                    alt=""
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Input
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
                onChange={(e) =>
                  handleLogoChange(e.target.files?.[0] ?? null)
                }
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : company ? (
                "Salvar alterações"
              ) : (
                "Criar empresa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
