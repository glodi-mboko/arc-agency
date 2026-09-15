import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold text-primary">{value}</div>
        {change !== null && (
          <div
            className={cn(
              "mt-1 text-xs font-medium",
              change >= 0 ? "text-green-600" : "text-destructive",
            )}
          >
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% ce mois
          </div>
        )}
      </CardContent>
    </Card>
  );
}
