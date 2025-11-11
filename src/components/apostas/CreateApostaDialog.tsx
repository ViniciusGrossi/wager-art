import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { bookiesService } from "@/services/bookies";
import { apostasService } from "@/services/apostas";
import type { Bookie, ApostaFormData } from "@/types/betting";
import { formatCurrency, cn } from "@/lib/utils";
import { CalendarIcon, TrendingUp, Wallet, Zap, Gift, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  tipo_aposta: z.string().min(1, "Tipo de aposta é obrigatório"),
  casa_de_apostas: z.string().min(1, "Casa de apostas é obrigatória"),
  valor_apostado: z.number().min(0.01, "Valor mínimo é R$ 0,01"),
  odd: z.number().min(1.01, "Odd mínima é 1.01"),
  bonus: z.number().min(0).default(0),
  turbo: z.number().min(0).default(0),
  detalhes: z.string().optional(),
  partida: z.string().optional(),
  torneio: z.string().optional(),
  data: z.date({ required_error: "Data é obrigatória" }),
});

type FormData = z.infer<typeof formSchema>;

interface CreateApostaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const categorias = ["Futebol", "Basquete", "Tênis", "Vôlei", "E-Sports", "Outros"];
const tiposAposta = ["Simples", "Múltipla", "Sistema", "Live"];

export function CreateApostaDialog({ open, onOpenChange, onSuccess }: CreateApostaDialogProps) {
  const [bookies, setBookies] = useState<Bookie[]>([]);
  const [selectedBookie, setSelectedBookie] = useState<Bookie | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria: "",
      tipo_aposta: "",
      casa_de_apostas: "",
      valor_apostado: 0,
      odd: 1.01,
      bonus: 0,
      turbo: 0,
      detalhes: "",
      partida: "",
      torneio: "",
    },
  });

  const valorApostado = form.watch("valor_apostado") || 0;
  const odd = form.watch("odd") || 1;
  const bonus = form.watch("bonus") || 0;
  const turbo = form.watch("turbo") || 0;

  const retornoPotencial = valorApostado * odd + bonus + turbo;
  const lucroPotencial = retornoPotencial - valorApostado;

  useEffect(() => {
    if (open) {
      loadBookies();
    }
  }, [open]);

  const loadBookies = async () => {
    try {
      const data = await bookiesService.list();
      setBookies(data);
    } catch (error) {
      console.error("Erro ao carregar casas:", error);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedBookie) {
      toast({ title: "Erro", description: "Selecione uma casa de apostas", variant: "destructive" });
      return;
    }

    if (data.valor_apostado > (selectedBookie.balance || 0)) {
      toast({ 
        title: "Saldo Insuficiente", 
        description: `Você possui apenas ${formatCurrency(selectedBookie.balance || 0)} na ${selectedBookie.name}`,
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      const apostaData: ApostaFormData = {
        categoria: data.categoria,
        tipo_aposta: data.tipo_aposta,
        casa_de_apostas: data.casa_de_apostas,
        valor_apostado: data.valor_apostado,
        odd: data.odd,
        bonus: data.bonus,
        turbo: data.turbo,
        detalhes: data.detalhes,
        partida: data.partida,
        torneio: data.torneio,
        data: format(data.data, "yyyy-MM-dd"),
      };

      await apostasService.create(apostaData, selectedBookie.balance || 0);

      toast({ title: "Sucesso!", description: "Aposta criada com sucesso" });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao criar aposta", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nova Aposta</DialogTitle>
          <DialogDescription>
            Preencha os dados da sua aposta e acompanhe o retorno potencial
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preview do Retorno Potencial */}
            <AnimatePresence>
              {valorApostado > 0 && odd > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Retorno Potencial</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-1">
                    {formatCurrency(retornoPotencial)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Lucro: <span className="text-foreground font-semibold">{formatCurrency(lucroPotencial)}</span>
                    {" • "}ROI: <span className="text-foreground font-semibold">{((lucroPotencial / valorApostado) * 100).toFixed(2)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_aposta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Aposta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposAposta.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="casa_de_apostas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Casa de Apostas
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const bookie = bookies.find((b) => b.name === value);
                      setSelectedBookie(bookie || null);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a casa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookies.map((bookie) => (
                        <SelectItem key={bookie.id} value={bookie.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{bookie.name}</span>
                            <span className="text-xs text-muted-foreground ml-4">
                              {formatCurrency(bookie.balance || 0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBookie && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Saldo disponível: {formatCurrency(selectedBookie.balance || 0)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_apostado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Apostado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odd</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Bônus (R$)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="turbo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Turbo (R$)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partida</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Flamengo x Palmeiras" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="torneio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Torneio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Brasileirão Série A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Aposta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="detalhes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes da Aposta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Ambos marcam, Over 2.5 gols..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Aposta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
