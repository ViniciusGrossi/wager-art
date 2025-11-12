import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface TopItemsListProps {
  items: { name: string; value: number }[];
  title?: string;
}

export function TopItemsList({ items, title }: TopItemsListProps) {
  return (
    <Card className="glass-effect">
      <CardContent>
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li key={it.name} className="flex justify-between">
              <span className="truncate max-w-[70%]">{idx + 1}. {it.name}</span>
              <span className="font-mono">{formatCurrency(it.value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
