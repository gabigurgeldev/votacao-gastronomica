"use client";

import * as React from "react";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreInput } from "@/components/ui/score-input";
import type { Category, Dish } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { submitPublicVote } from "../actions";
import { formatCPF, formatPhone } from "@/lib/cpf";
import { cn } from "@/lib/utils";

interface VoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish: Dish | null;
  categories: Category[];
  onSuccess: (dishId: string) => void;
}

type Step = "scores" | "register" | "done";

function Stepper({ step }: { step: Step }) {
  const stepIndex = step === "scores" ? 0 : step === "register" ? 1 : 2;
  const items = ["Notas", "Cadastro", "Pronto"];
  return (
    <ol className="mt-2 flex items-center gap-2" aria-label="Etapas">
      {items.map((label, i) => {
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                done && "bg-success text-success-foreground",
                active && "bg-brand text-brand-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < items.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-success/70" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function VoteDialog({
  open,
  onOpenChange,
  dish,
  categories,
  onSuccess,
}: VoteDialogProps) {
  const [step, setStep] = React.useState<Step>("scores");
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cpf, setCpf] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("scores");
        setScores({});
        setName("");
        setEmail("");
        setPhone("");
        setCpf("");
        setErrors({});
        setSubmitting(false);
      }, 250);
    }
  }, [open]);

  if (!dish) return null;

  const allRated =
    categories.length > 0 &&
    categories.every(
      (c) =>
        typeof scores[c.id] === "number" &&
        scores[c.id] >= 5 &&
        scores[c.id] <= 10,
    );

  const handleSubmit = async () => {
    setErrors({});
    setSubmitting(true);
    const result = await submitPublicVote({
      dishId: dish.id,
      scores: categories.map((c) => ({ categoryId: c.id, score: scores[c.id] })),
      voter: { name, email, phone, cpf },
    });
    setSubmitting(false);

    if (!result.ok) {
      if (result.code === "duplicate") {
        toast({
          title: "Não foi possível concluir",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Não foi possível registrar a avaliação",
          description: result.error,
          variant: "destructive",
        });
      }
      return;
    }

    setStep("done");
    setTimeout(() => {
      onSuccess(dish.id);
    }, 1400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-hidden p-0 sm:max-w-xl">
        <div className="ss-scroll flex max-h-[92dvh] flex-col overflow-y-auto">
          <div className="flex-1 p-6 pb-4 sm:p-7 sm:pb-5">
            {step === "scores" && (
              <>
                <DialogHeader>
                  <DialogTitle>{dish.name}</DialogTitle>
                  <DialogDescription>
                    Dê uma nota de 5 a 10 em cada categoria. Todas são
                    obrigatórias.
                  </DialogDescription>
                  <Stepper step={step} />
                </DialogHeader>

                <div className="mt-5 flex flex-col gap-5">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <Label className="text-[15px]">{cat.name}</Label>
                        {typeof scores[cat.id] === "number" && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                            {scores[cat.id]}/10
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground">
                          {cat.description}
                        </p>
                      )}
                      <ScoreInput
                        value={scores[cat.id] ?? null}
                        onChange={(v) =>
                          setScores((prev) => ({ ...prev, [cat.id]: v }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === "register" && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("scores")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted ss-focus"
                      aria-label="Voltar"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <DialogTitle>Identifique-se para avaliar</DialogTitle>
                  </div>
                  <DialogDescription>
                    Use os mesmos dados para avaliar outros pratos: uma avaliação
                    por prato, com notas de 5 a 10 em cada critério.
                  </DialogDescription>
                  <Stepper step={step} />
                </DialogHeader>

                <form
                  id="vote-register-form"
                  className="mt-5 flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      placeholder="voce@exemplo.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        autoComplete="tel"
                        required
                        placeholder="(11) 98765-4321"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        inputMode="numeric"
                        value={cpf}
                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                        required
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  {errors.root && (
                    <p className="text-sm text-destructive">{errors.root}</p>
                  )}
                </form>
              </>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success shadow-soft">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <DialogTitle className="text-center">
                  Avaliação registrada!
                </DialogTitle>
                <DialogDescription className="max-w-sm text-center">
                  Você pode avaliar outros pratos quando quiser.
                </DialogDescription>
              </div>
            )}
          </div>

          {step !== "done" && (
            <div
              className={cn(
                "sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-border bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end sm:gap-2 sm:px-7 sm:py-4",
              )}
            >
              <Button
                variant="ghost"
                type="button"
                onClick={() => onOpenChange(false)}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              {step === "scores" ? (
                <Button
                  disabled={!allRated}
                  onClick={() => setStep("register")}
                  size="lg"
                  className="sm:w-auto"
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="vote-register-form"
                  disabled={submitting}
                  size="lg"
                  className="sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Confirmar avaliação"
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
