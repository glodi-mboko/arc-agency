import { CheckCircle2, Circle } from "lucide-react";

import { PACKAGE_STATUS_LABELS, type PackageStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: PackageStatus[] = [
  "registered",
  "in_transit",
  "arrived",
  "picked_up",
];

interface HistoryRow {
  status: PackageStatus;
  location: string | null;
  created_at: string;
}

interface StatusHistoryTimelineProps {
  currentStatus: PackageStatus;
  history: HistoryRow[];
}

export function StatusHistoryTimeline({
  currentStatus,
  history,
}: StatusHistoryTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div>
      {STATUS_ORDER.map((status, i) => {
        const entry = history.find((h) => h.status === status);
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STATUS_ORDER.length - 1;

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              {reached ? (
                <CheckCircle2
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isCurrent ? "text-accent" : "text-green-600",
                  )}
                />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/30" />
              )}
              {!isLast && (
                <div
                  className={cn(
                    "w-px flex-1 my-1",
                    i < currentIndex ? "bg-green-600" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <div
                className={cn(
                  "text-sm font-semibold",
                  reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {PACKAGE_STATUS_LABELS[status]}
              </div>
              {entry?.location && (
                <div className="text-xs text-muted-foreground">
                  {entry.location}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {entry
                  ? new Date(entry.created_at).toLocaleString("fr-FR")
                  : reached
                    ? ""
                    : "En attente"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
