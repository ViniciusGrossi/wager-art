import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, TrendingDown, ClipboardList, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/dashboard/KPICard";
import { LucroChart } from "@/components/dashboard/LucroChart";
import { DistributionChart } from "@/components/dashboard/DistributionChart";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData, SeriesData } from "@/types/betting";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import { ApostasStats } from "@/components/apostas/ApostasStats";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [distribution, setDistribution] = useState<{ name: string; value: number }[]>([]);
  const [lastApostas, setLastApostas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo } = useFilterStore();
  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kpisData, seriesData, apostas] = await Promise.all([
        apostasService.kpis({ startDate, endDate, casa, tipo }),
        apostasService.series({ startDate, endDate, casa, tipo }),
        apostasService.list({ startDate, endDate, casa, tipo, limit: 100 }),
      ]);
      
      setKpis(kpisData);
      setSeries(seriesData);

      const statusCount = apostas.data.reduce((acc, aposta) => {
        const status = aposta.resultado || "Pendente";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setDistribution(
        Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      );

      // keep last 5 apostas for "Geral" quick view
      setLastApostas((apostas.data || []).slice(0, 5));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu desempenho</p>
        </div>
      </motion.div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total Apostado"
              value={kpis ? formatCurrency(kpis.totalApostado) : "-"}
              icon={DollarSign}
              isLoading={isLoading}
              delay={0}
            />
            <KPICard
              title="Lucro"
              value={kpis ? formatCurrency(kpis.lucro) : "-"}
              icon={kpis && kpis.lucro >= 0 ? TrendingUp : TrendingDown}
              isLoading={isLoading}
              delay={0.1}
            />
            <KPICard
              title="ROI"
              value={kpis ? formatPercentage(kpis.roi) : "-"}
              icon={Target}
              isLoading={isLoading}
              delay={0.2}
            />
            <KPICard
              title="Taxa de Acerto"
              value={kpis ? formatPercentage(kpis.taxaAcerto) : "-"}
              icon={Target}
              isLoading={isLoading}
              delay={0.3}
            />
            <KPICard
              title="Total Apostas"
              value={kpis ? kpis.totalApostas : "-"}
              icon={ClipboardList}
              isLoading={isLoading}
              delay={0.4}
            />
            <KPICard
              title="Pendentes"
              value={kpis ? kpis.apostasPendentes : "-"}
              icon={Clock}
              isLoading={isLoading}
              delay={0.5}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LucroChart data={series} isLoading={isLoading} />
            <DistributionChart data={distribution} isLoading={isLoading} />
          </div>

          <div className="space-y-4">
            <Card className="glass-effect">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Últimas 5 Apostas</h3>
                <ApostasTable data={lastApostas} isLoading={isLoading} />
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Estatísticas Gerenciais</h3>
                <ApostasStats apostas={lastApostas} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        

        
      </Tabs>
    </div>
  );
}
