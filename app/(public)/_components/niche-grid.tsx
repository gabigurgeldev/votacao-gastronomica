"use client";

import * as React from "react";
import { Utensils } from "lucide-react";
import type { Company, Niche, Vote } from "@/lib/supabase/types";
import { NicheCard } from "./niche-card";
import { CompaniesDialog } from "./companies-dialog";
import { AuthDialog } from "./auth-dialog";

interface NicheGridProps {
  niches: Niche[];
  companies: Company[];
  votes: Vote[];
  isAuthenticated: boolean;
}

export function NicheGrid({
  niches,
  companies,
  votes,
  isAuthenticated,
}: NicheGridProps) {
  const [selected, setSelected] = React.useState<Niche | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);

  const votesByNiche = React.useMemo(() => {
    const map = new Map<string, Vote>();
    votes.forEach((v) => map.set(v.niche_id, v));
    return map;
  }, [votes]);

  const companyCountByNiche = React.useMemo(() => {
    const map = new Map<string, number>();
    companies.forEach((c) => {
      if (!c.active) return;
      map.set(c.niche_id, (map.get(c.niche_id) ?? 0) + 1);
    });
    return map;
  }, [companies]);

  const handleSelect = (niche: Niche) => {
    setSelected(niche);
    setDialogOpen(true);
  };

  const handleAskAuth = () => {
    setAuthOpen(true);
  };

  const handleAuthenticated = () => {
    if (selected) setDialogOpen(true);
  };

  if (!niches.length) {
    return (
      <div className="ss-card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Utensils className="h-7 w-7" />
        </div>
        <div className="max-w-sm">
          <h3 className="font-display text-xl tracking-tight">
            Nenhum nicho publicado ainda
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assim que o administrador publicar os nichos, eles aparecem aqui.
          </p>
        </div>
      </div>
    );
  }

  const selectedVote = selected ? votesByNiche.get(selected.id) ?? null : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
        {niches.map((niche) => (
          <NicheCard
            key={niche.id}
            niche={niche}
            voted={votesByNiche.has(niche.id)}
            companyCount={companyCountByNiche.get(niche.id) ?? 0}
            onClick={() => handleSelect(niche)}
          />
        ))}
      </div>

      <CompaniesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        niche={selected}
        companies={companies}
        isAuthenticated={isAuthenticated}
        hasVoted={!!selectedVote}
        votedCompanyId={selectedVote?.company_id ?? null}
        onAskAuth={handleAskAuth}
        onVoted={() => setDialogOpen(false)}
      />

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onAuthenticated={handleAuthenticated}
      />
    </>
  );
}
