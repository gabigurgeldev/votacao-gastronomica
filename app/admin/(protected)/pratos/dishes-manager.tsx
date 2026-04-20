"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChefHat, Loader2, ImageIcon } from "lucide-react";
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
import type { Dish } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { createDish, deleteDish, updateDish } from "./actions";

export function DishesManager({ initialDishes }: { initialDishes: Dish[] }) {
  const router = useRouter();
  const [dishes] = React.useState(initialDishes);
  const [editing, setEditing] = React.useState<Dish | null>(null);
  const [open, setOpen] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (d: Dish) => {
    setEditing(d);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este prato? Os votos relacionados também serão removidos.")) return;
    const res = await deleteDish(id);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Prato excluído", variant: "success" });
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Novo prato
        </Button>
      </div>

      {dishes.length === 0 ? (
        <div className="ss-card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ChefHat className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-display text-lg">Nenhum prato cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Clique em &ldquo;Novo prato&rdquo; para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((d) => (
            <div key={d.id} className="ss-card overflow-hidden">
              <div className="relative aspect-[4/3] w-full bg-muted">
                {d.image_url ? (
                  <Image
                    src={d.image_url}
                    alt={d.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ChefHat className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                )}
                {!d.active && (
                  <Badge
                    variant="secondary"
                    className="absolute left-3 top-3 bg-background/80 backdrop-blur"
                  >
                    Inativo
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4">
                <div>
                  <h3 className="font-display text-lg leading-tight">{d.name}</h3>
                  {d.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {d.description}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(d)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DishDialog
        open={open}
        onOpenChange={setOpen}
        dish={editing}
        onSaved={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function DishDialog({
  open,
  onOpenChange,
  dish,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dish: Dish | null;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) setPreviewUrl(null);
  }, [open]);

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = dish ? await updateDish(dish.id, fd) : await createDish(fd);
    setSubmitting(false);
    if (!res.ok) {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
      return;
    }
    toast({
      title: dish ? "Prato atualizado" : "Prato criado",
      variant: "success",
    });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto ss-scroll sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{dish ? "Editar prato" : "Novo prato"}</DialogTitle>
          <DialogDescription>
            Capriche no nome e na imagem — é isso que o visitante vê primeiro.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do prato</Label>
            <Input id="name" name="name" defaultValue={dish?.name ?? ""} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={dish?.description ?? ""}
              placeholder="Conte um pouco sobre o prato..."
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
                defaultValue={dish?.display_order ?? 0}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={dish?.active ?? true}
                  className="h-4 w-4 rounded border-border accent-brand"
                />
                Ativo
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="image">Imagem</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-muted">
                {previewUrl ? (
                  <Image src={previewUrl} alt="" fill className="object-cover" />
                ) : dish?.image_url ? (
                  <Image
                    src={dish.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                className="file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : dish ? (
                "Salvar alterações"
              ) : (
                "Criar prato"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
