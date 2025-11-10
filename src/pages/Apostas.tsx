import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Apostas() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Apostas</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas apostas</p>
        </div>
      </motion.div>

      <Tabs defaultValue="todas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="ganhos">Ganhos</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
          <TabsTrigger value="cashout">Cashout</TabsTrigger>
          <TabsTrigger value="nova">Nova Aposta</TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <div className="text-center py-12 text-muted-foreground">
            Lista de apostas em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
