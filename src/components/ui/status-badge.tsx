import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Ban, DollarSign } from "lucide-react";
import { ResultadoType } from "@/types/betting";

interface StatusBadgeProps {
  status: ResultadoType;
}

const statusConfig = {
  Ganhou: {
    variant: "default" as const,
    icon: CheckCircle2,
    label: "Ganhou",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  Perdeu: {
    variant: "destructive" as const,
    icon: XCircle,
    label: "Perdeu",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
  },
  Pendente: {
    variant: "secondary" as const,
    icon: Clock,
    label: "Pendente",
    className: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
  },
  Cancelado: {
    variant: "outline" as const,
    icon: Ban,
    label: "Cancelado",
    className: "bg-muted/50 text-muted-foreground hover:bg-muted border-muted",
  },
  Cashout: {
    variant: "secondary" as const,
    icon: DollarSign,
    label: "Cashout",
    className: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.Pendente;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
