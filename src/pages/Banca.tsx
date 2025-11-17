import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { bookiesService } from "@/services/bookies";
import { BookieCard } from "@/components/banca/BookieCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { TransactionsHistory } from "@/components/banca/TransactionsHistory";
import { GoalsManager } from "@/components/banca/GoalsManager";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, Calendar, Target } from "lucide-react";
import type { Bookie } from "@/types/betting";
import dayjs from "dayjs";

export default function Banca() {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookies();
  }, []);

  const loadBookies = async () => {
    setIsLoading(true);
    try {
      const data = await bookiesService.list();
      const sorted = data.sort((a, b) => (b.balance || 0) - (a.balance || 0));
      setBookies(sorted);
    } catch (error) {
      console.error("Erro ao carregar bookies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = bookies.reduce((sum, b) => sum + (b.balance || 0), 0);
  const maiorCasa = bookies.reduce((max, b) => 
    (b.balance || 0) > (max.balance || 0) ? b : max
  , bookies[0] || { name: "-", balance: 0 });
  
  const maisRecente = bookies.reduce((recent, b) => 
    dayjs(b.last_update).isAfter(dayjs(recent.last_update)) ? b : recent
  , bookies[0] || { last_update: new Date().toISOString() });

  // Cálculo das unidades de aposta (1 unidade = 2% da banca total)
  const unidade = useMemo(() => {
    return totalBalance * 0.02;
  }, [totalBalance]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Banca</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas casas de apostas</p>
        </div>
      </motion.div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            title="Saldo Total"
            value={formatCurrency(totalBalance)}
            icon={Wallet}
            isLoading={isLoading}
            delay={0}
          />
          <KPICard
            title="Maior Casa"
            value={`${maiorCasa?.name || "-"} (${formatCurrency(maiorCasa?.balance || 0)})`}
            icon={TrendingUp}
            isLoading={isLoading}
            delay={0.1}
          />
          <KPICard
            title="Última Atualização"
            value={maisRecente ? dayjs(maisRecente.last_update).format("DD/MM/YYYY") : "-"}
            icon={Calendar}
            isLoading={isLoading}
            delay={0.2}
          />
        </div>
        
        {/* Unidades de Aposta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Unidades de Aposta</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                1 unidade = 2% da banca total
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0.25, 0.5, 0.75, 1].map((multiplicador) => (
                <motion.div 
                  key={multiplicador}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + multiplicador * 0.1 }}
                  className="group relative overflow-hidden bg-card hover:bg-accent/50 border-2 border-primary/20 hover:border-primary/40 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-sm text-muted-foreground mb-2 font-medium">
                      {multiplicador} unidade{multiplicador !== 1 ? 's' : ''}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {formatCurrency(unidade * multiplicador)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(multiplicador * 2).toFixed(2)}% da banca
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalBalance === 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  💡 Adicione saldo às suas casas de apostas para calcular as unidades
                </p>
              </div>
            )}
          </Card>
        </motion.div>
        
        <GoalsManager />
