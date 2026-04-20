"use client";

import * as React from "react";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

export function LoginForm() {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.session) {
        const msg = error?.message ?? "Verifique as credenciais.";
        setErrorMsg(msg);
        toast({
          title: "Não foi possível entrar",
          description: msg,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role || data.user?.app_metadata?.role;

      let target: string | null = null;
      if (role === "admin") {
        target = "/admin/dashboard";
      } else if (role === "jurado") {
        target = "/jurado/dashboard";
      }

      if (!target) {
        await supabase.auth.signOut();
        const msg =
          "Seu usuário não tem permissão para entrar nesta área. Contate um administrador.";
        setErrorMsg(msg);
        toast({
          title: "Acesso restrito",
          description: msg,
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      window.location.assign(target);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao conectar com o servidor.";
      setErrorMsg(msg);
      console.error("Erro no login:", err);
      toast({
        title: "Erro de conexão",
        description: msg,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {errorMsg}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="voce@exemplo.com"
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
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
      <Button type="submit" size="lg" disabled={submitting} className="mt-1">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
