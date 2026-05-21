"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
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
import { toast } from "@/components/ui/toaster";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "login",
  onAuthenticated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultMode?: Mode;
  onAuthenticated?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>(defaultMode);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setSubmitting(false);
        setErrorMsg(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const emailNorm = email.trim().toLowerCase();

    try {
      if (mode === "signup") {
        if (name.trim().length < 2) {
          setErrorMsg("Informe seu nome.");
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg("Senha deve ter ao menos 6 caracteres.");
          setSubmitting(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: emailNorm,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setSubmitting(false);
          return;
        }

        if (!data.session) {
          toast({
            title: "Confirme seu e-mail",
            description: "Enviamos um link de confirmação. Após confirmar, entre normalmente.",
          });
          setMode("login");
          setSubmitting(false);
          return;
        }

        toast({ title: "Cadastro realizado", variant: "success" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailNorm,
          password,
        });
        if (error) {
          setErrorMsg("E-mail ou senha incorretos.");
          setSubmitting(false);
          return;
        }
        toast({ title: "Bem-vindo!", variant: "success" });
      }

      onOpenChange(false);
      router.refresh();
      onAuthenticated?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Entrar para votar" : "Criar sua conta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Use sua conta para registrar votos. Você não sai desta página."
              : "Crie uma conta rápida — só nome, e-mail e senha."}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 mt-2 flex rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ss-focus",
              mode === "login"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ss-focus",
              mode === "signup"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {errorMsg}
            </div>
          )}

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-name">Nome</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">E-mail</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-password">Senha</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="pl-10 pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ss-focus"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "login" ? "Entrando..." : "Criando..."}
              </>
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Criar conta e entrar"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
