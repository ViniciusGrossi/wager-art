import { useMemo } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { formatCurrency } from "@/lib/utils";
import { Clock, DollarSign, TrendingUp, Target } from "lucide-react";
import type { Aposta } from "@/types/betting";

interface ResultadosKPIsProps {
  apostas: Aposta[];
  isLoading: boolean;
}

export function ResultadosKPIs({ apostas, isLoading }: ResultadosKPIsProps) {
  const metrics = useMemo(() => {
    const pendentes = apostas.filter((a) => a.resultado === "Pendente");
    
    const totalApostadoPendente = pendentes.reduce(
      (sum, a) => sum + (a.valor_apostado || 0),
      0
    );

    const retornoPotencial = pendentes.reduce((sum, a) => {
      const retorno = (a.valor_apostado || 0) * (a.odd || 1) + (a.bonus || 0) + (a.turbo || 0);
      return sum + retorno;
    }, 0);

    const lucroPotencial = retornoPotencial - totalApostadoPendente;

    const roiPotencial = totalApostadoPendente > 0
      ? ((lucroPotencial / totalApostadoPendente) * 100)
      : 0;

    return {
      apostasPendentes: pendentes.length,
      totalApostadoPendente,
      retornoPotencial,
      lucroPotencial,
      roiPotencial,
    };
  }, [apostas]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Apostas Pendentes"
        value={metrics.apostasPendentes.toString()}
        icon={Clock}
        isLoading={isLoading}
        delay={0}
      />
      <KPICard
        title="Total Apostado (Pendente)"
        value={formatCurrency(metrics.totalApostadoPendente)}
        icon={DollarSign}
        isLoading={isLoading}
        delay={0.1}
      />
      <KPICard
        title="Retorno Potencial"
        value={formatCurrency(metrics.retornoPotencial)}
        icon={Target}
        isLoading={isLoading}
        delay={0.2}
      />
      <KPICard
        title="Lucro Potencial"
        value={formatCurrency(metrics.lucroPotencial)}
        subtitle={`ROI: ${metrics.roiPotencial.toFixed(2)}%`}
        icon={TrendingUp}
        isLoading={isLoading}
        delay={0.3}
      />
    </div>
  );
}
