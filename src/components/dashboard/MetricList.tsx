import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface MetricItem {
  name: string;
  value: number;
}

interface MetricListProps {
  items: MetricItem[];
  title?: string;
  type?: "currency" | "percent" | "number";
}

export function MetricList({ items, title, type = "number" }: MetricListProps) {
  const fmt = (v: number) => {
    if (type === "currency") return formatCurrency(v);
    if (type === "percent") return `${v.toFixed(1)}%`;
    return v.toString();
  };

  return (
    <Card className="glass-effect">
      <CardContent>
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <ul className="space-y-2 text-sm">
          {items.map((it, idx) => (
            <li key={it.name} className="flex justify-between">
              <span className="truncate max-w-[70%]">{idx + 1}. {it.name}</span>
              <span className="font-mono">{fmt(it.value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
