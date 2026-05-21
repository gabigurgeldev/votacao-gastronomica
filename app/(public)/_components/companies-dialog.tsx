"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Building2, Vote as VoteIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Company, Niche } from "@/lib/supabase/types";
import { toast } from "@/components/ui/toaster";
import { submitNicheVote } from "../actions";
import { cn } from "@/lib/utils";

interface CompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  niche: Niche | null;
  companies: Company[];
  isAuthenticated: boolean;
  hasVoted: boolean;
  votedCompanyId: string | null;
  onAskAuth: () => void;
  onVoted: () => void;
}

export function CompaniesDialog({
  open,
  onOpenChange,
  niche,
  companies,
  isAuthenticated,
  hasVoted,
  votedCompanyId,
  onAskAuth,
  onVoted,
}: CompaniesDialogProps) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = React.useState<string | null>(null);
  const [successId, setSuccessId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setSubmittingId(null);
        setSuccessId(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!niche) return null;

  const nicheCompanies = companies.filter((c) => c.niche_id === niche.id && c.active);

  const handleVote = async (company: Company) => {
    if (!isAuthenticated) {
      onOpenChange(false);
      onAskAuth();
      return;
    }
    if (hasVoted) {
      toast({
        title: "Já votado",
        description: "Você já votou neste nicho.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingId(company.id);
    const res = await submitNicheVote({ nicheId: niche.id, companyId: company.id });
    setSubmittingId(null);

    if (!res.ok) {
      if (res.code === "unauthenticated") {
        onOpenChange(false);
        onAskAuth();
        return;
      }
      toast({
        title: "Não foi possível registrar",
        description: res.error,
        variant: "destructive",
      });
      return;
    }

    setSuccessId(company.id);
    toast({
      title: "Voto registrado!",
      description: `Você votou em ${company.name}.`,
      variant: "success",
    });

    setTimeout(() => {
      onVoted();
      router.refresh();
    }, 1100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-hidden p-0 sm:max-w-xl">
        <div className="ss-scroll flex max-h-[92dvh] flex-col overflow-y-auto">
          <div className="p-6 pb-2 sm:p-7 sm:pb-3">
            <DialogHeader>
              <DialogTitle>{niche.name}</DialogTitle>
              <DialogDescription>
                {hasVoted
                  ? "Você já registrou seu voto neste nicho."
                  : "Escolha sua empresa favorita e toque em Votar. Apenas um voto por nicho."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-3 px-6 pb-6 sm:px-7 sm:pb-7">
            {nicheCompanies.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="font-medium">Nenhuma empresa cadastrada neste nicho ainda.</p>
              </div>
            ) : (
              nicheCompanies.map((company) => {
                const isVotedHere = votedCompanyId === company.id;
                const isSuccess = successId === company.id;
                const isSubmitting = submittingId === company.id;
                const buttonLocked = hasVoted || !!submittingId;
                return (
                  <div
                    key={company.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-colors",
                      isVotedHere && "border-success/50 bg-success/5",
                      isSuccess && "border-success bg-success/10",
                    )}
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {company.logo_url ? (
                        <Image
                          src={company.logo_url}
                          alt={company.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">
                        {company.name}
                      </p>
                      {isVotedHere && (
                        <p className="mt-0.5 text-xs font-medium text-success">
                          Seu voto
                        </p>
                      )}
                    </div>

                    {isVotedHere ? (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success px-3 text-sm font-semibold text-success-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Votado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleVote(company)}
                        disabled={buttonLocked}
                        className="shrink-0"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Votando...</span>
                          </>
                        ) : (
                          <>
                            <VoteIcon className="h-4 w-4" />
                            Votar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
