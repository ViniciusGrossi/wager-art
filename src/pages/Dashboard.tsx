import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Target, TrendingDown, ClipboardList, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/dashboard/KPICard";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { KPIData } from "@/types/betting";

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startDate, endDate, casa, tipo } = useFilterStore();

  useEffect(() => {
    loadKPIs();
  }, [startDate, endDate, casa, tipo]);

  const loadKPIs = async () => {
    setIsLoading(true);
    try {
      const data = await apostasService.kpis({ startDate, endDate, casa, tipo });
      setKpis(data);
    } catch (error) {
      console.error("Erro ao carregar KPIs:", error);
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
          <TabsTrigger value="casa">Por Casa</TabsTrigger>
          <TabsTrigger value="tipo">Por Tipo</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="casa">
          <div className="text-center py-12 text-muted-foreground">
            Visualização por casa em desenvolvimento...
          </div>
        </TabsContent>

        <TabsContent value="tipo">
          <div className="text-center py-12 text-muted-foreground">
            Visualização por tipo em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
