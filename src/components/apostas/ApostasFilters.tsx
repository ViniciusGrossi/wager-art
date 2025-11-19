import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { ResultadoType } from "@/types/betting";

interface ApostasFiltersProps {
  selectedStatus: ResultadoType | "Todos";
  onStatusChange: (status: ResultadoType | "Todos") => void;
  selectedCasa: string;
  onCasaChange: (casa: string) => void;
  casasDisponiveis: string[];
}

const statusOptions: Array<ResultadoType | "Todos"> = [
  "Todos",
  "Pendente",
  "Ganhou",
  "Perdeu",
  "Cashout",
  "Cancelado",
];

export function ApostasFilters({
  selectedStatus,
  onStatusChange,
  selectedCasa,
  onCasaChange,
  casasDisponiveis,
}: ApostasFiltersProps) {
  const hasFilters = selectedStatus !== "Todos" || selectedCasa !== "Todas";

  const clearFilters = () => {
    onStatusChange("Todos");
    onCasaChange("Todas");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCasa} onValueChange={onCasaChange}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Casa de Apostas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todas">Todas as Casas</SelectItem>
          {casasDisponiveis.map((casa) => (
            <SelectItem key={casa} value={casa}>
              {casa}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto">
          <X className="h-4 w-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
