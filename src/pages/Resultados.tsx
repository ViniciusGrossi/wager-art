import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Resultados() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Resultados</h1>
          <p className="text-muted-foreground mt-1">Registre os resultados das apostas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="pendentes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="cashout">Cashout</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes">
          <div className="text-center py-12 text-muted-foreground">
            Apostas pendentes em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
