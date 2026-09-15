import { PACKAGE_STATUS_LABELS, type PackageStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PackageStatus, string> = {
  registered: "bg-status-registered/10 text-status-registered",
  in_transit: "bg-status-transit/10 text-status-transit",
  arrived: "bg-status-arrived/10 text-status-arrived",
  picked_up: "bg-status-delivered/10 text-status-delivered",
};

export function StatusBadge({ status }: { status: PackageStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {PACKAGE_STATUS_LABELS[status]}
    </span>
  );
}
