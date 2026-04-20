"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  UserCog,
  KeyRound,
  Search,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { createJury, deleteJury, resetJuryPassword } from "./actions";

export interface JuryUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

function initialsOf(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function JuriesManager({ juries }: { juries: JuryUser[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [resetting, setResetting] = React.useState<JuryUser | null>(null);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return juries;
    return juries.filter(
      (j) =>
        j.name.toLowerCase().includes(q) || j.email.toLowerCase().includes(q),
    );
  }, [juries, query]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await createJury(new FormData(e.currentTarget));
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Jurado criado", variant: "success" });
    setOpen(false);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este jurado? As avaliações dele também serão removidas."))
      return;
    const res = await deleteJury(id);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Jurado removido", variant: "success" });
    router.refresh();
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetting) return;
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const res = await resetJuryPassword(resetting.id, password);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Senha atualizada", variant: "success" });
    setResetting(null);
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
            {juries.length} {juries.length === 1 ? "jurado" : "jurados"}
          </span>
          {query && (
            <span className="text-xs text-muted-foreground">
              {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="pl-9"
              aria-label="Buscar jurado"
            />
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo jurado
          </Button>
        </div>
      </div>

      {juries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <UserCog className="h-7 w-7" />
          </div>
          <div>
            <p className="font-display text-lg">Nenhum jurado cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre os jurados do evento para que possam avaliar os pratos.
            </p>
          </div>
          <Button className="mt-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Cadastrar primeiro jurado
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          Nenhum jurado encontrado para “{query}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((j) => (
            <div
              key={j.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                {initialsOf(j.name, j.email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{j.name || "Sem nome"}</p>
                <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{j.email}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setResetting(j)}
                  title="Redefinir senha"
                  aria-label="Redefinir senha"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(j.id)}
                  title="Remover jurado"
                  aria-label="Remover jurado"
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
            <DialogTitle>Novo jurado</DialogTitle>
            <DialogDescription>
              O jurado entra pela mesma página de login (área administrativa) e
              é redirecionado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jname">Nome</Label>
              <Input id="jname" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jemail">E-mail</Label>
              <Input id="jemail" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jpassword">Senha inicial</Label>
              <Input
                id="jpassword"
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="mínimo 8 caracteres"
              />
            </div>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar jurado"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetting} onOpenChange={(o) => !o && setResetting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>
              Uma nova senha será definida para {resetting?.email}.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleReset}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newpass">Nova senha</Label>
              <Input
                id="newpass"
                name="password"
                type="text"
                required
                minLength={8}
              />
            </div>
            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setResetting(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
