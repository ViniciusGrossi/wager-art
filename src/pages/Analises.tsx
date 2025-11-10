import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Analises() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Análises</h1>
          <p className="text-muted-foreground mt-1">Insights e estatísticas detalhadas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="roi" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roi">ROI & Lucro</TabsTrigger>
          <TabsTrigger value="acerto">Taxa de Acerto</TabsTrigger>
          <TabsTrigger value="sequencias">Sequências</TabsTrigger>
          <TabsTrigger value="odds">Odds & Momentum</TabsTrigger>
        </TabsList>

        <TabsContent value="roi">
          <div className="text-center py-12 text-muted-foreground">
            Gráficos de ROI e Lucro em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
