import { Users, Gavel, UserCheck, BarChart3 } from "lucide-react";
import { KpiCard } from "../../_components/kpi-card";
import type { VotesByTypeRow } from "@/lib/supabase/types";

interface KpiVoteCardsProps {
  votesByType: VotesByTypeRow[];
  avgPublic: number | null;
  avgJury: number | null;
}

export function KpiVoteCards({ votesByType, avgPublic, avgJury }: KpiVoteCardsProps) {
  const publicData = votesByType.find((v) => v.voter_type === "public");
  const juryData = votesByType.find((v) => v.voter_type === "jury");

  const publicVotes = publicData?.total_votes ?? 0;
  const juryVotes = juryData?.total_votes ?? 0;

  const formatAvg = (val: number | null) => {
    if (val == null) return "—";
    return val.toFixed(2).replace(".", ",");
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Avaliações do público"
        value={String(publicVotes)}
        sublabel={
          publicVotes === 1
            ? "1 avaliação registrada"
            : `${publicVotes} avaliações registradas`
        }
        icon={<Users className="h-5 w-5" />}
        accent="brand"
      />
      <KpiCard
        label="Avaliações dos jurados"
        value={String(juryVotes)}
        sublabel={
          juryVotes === 1 ? "1 avaliação registrada" : `${juryVotes} avaliações registradas`
        }
        icon={<Gavel className="h-5 w-5" />}
        accent="accent"
      />
      <KpiCard
        label="Média do Público"
        value={formatAvg(avgPublic)}
        sublabel="Nota média geral"
        icon={<UserCheck className="h-5 w-5" />}
        accent="brand"
      />
      <KpiCard
        label="Média dos Jurados"
        value={formatAvg(avgJury)}
        sublabel="Nota média geral"
        icon={<BarChart3 className="h-5 w-5" />}
        accent="success"
      />
    </div>
  );
}
