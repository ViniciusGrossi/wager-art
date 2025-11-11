import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { ResultadoCard } from "@/components/resultados/ResultadoCard";
import { ResultadosKPIs } from "@/components/resultados/ResultadosKPIs";
import { ApostasTable } from "@/components/apostas/ApostasTable";
import type { Aposta, ResultadoType } from "@/types/betting";
import { toast } from "sonner";

export default function Resultados() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApostas();
  }, []);

  const loadApostas = async () => {
    setIsLoading(true);
    try {
      const { data } = await apostasService.list({});
      setApostas(data);
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
      toast.error("Erro ao carregar apostas");
    } finally {
      setIsLoading(false);
    }
  };

  const apostasPendentes = useMemo(
    () => apostas.filter((aposta) => aposta.resultado === "Pendente"),
    [apostas]
  );

  const apostasFinalizadas = useMemo(
    () => apostas.filter((aposta) => aposta.resultado && aposta.resultado !== "Pendente"),
    [apostas]
  );

  const handleSetResult = async (id: number, resultado: ResultadoType, cashoutValue?: number) => {
    try {
      const aposta = apostas.find((a) => a.id === id);
      if (!aposta) throw new Error("Aposta não encontrada");

      await apostasService.setResult(id, resultado, aposta, cashoutValue);
      
      toast.success(`Resultado marcado como ${resultado}`);
      await loadApostas();
    } catch (error) {
      console.error("Erro ao definir resultado:", error);
      toast.error("Erro ao definir resultado");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Resultados</h1>
          <p className="text-muted-foreground mt-1">Confirme os resultados das apostas pendentes</p>
        </div>
      </motion.div>

      <ResultadosKPIs apostas={apostas} isLoading={isLoading} />

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Apostas Pendentes</h2>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : apostasPendentes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {apostasPendentes.map((aposta) => (
                <ResultadoCard
                  key={aposta.id}
                  aposta={aposta}
                  onSetResult={handleSetResult}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma aposta pendente
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Histórico de Resultados</h2>
          <ApostasTable data={apostasFinalizadas} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
