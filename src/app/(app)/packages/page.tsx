import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { getActiveAgencyId } from "@/lib/queries/current-agent";
import { getAllAgencies } from "@/lib/queries/agencies";
import type {
  PackageListFilters,
  PackageDirection,
} from "@/lib/queries/packages";
import { PackagesFilterBar } from "@/components/packages/packages-filter-bar";
import { PackagesResults } from "@/components/packages/packages-results";
import { PackagesResultsSkeleton } from "@/components/packages/packages-results-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PackageStatus } from "@/lib/types";

const PAGE_SIZE = 8;

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, agencyId, agencies] = await Promise.all([
    searchParams,
    getActiveAgencyId(),
    getAllAgencies(),
  ]);

  const page = Number(params.page) || 1;
  const filters: PackageListFilters = {
    search: typeof params.q === "string" ? params.q : undefined,
    status: (typeof params.status === "string" ? params.status : "all") as
      | PackageStatus
      | "all",
    originAgencyId: typeof params.origin === "string" ? params.origin : "all",
    destinationAgencyId:
      typeof params.destination === "string" ? params.destination : "all",
    period: (typeof params.period === "string" ? params.period : "all") as
      | "today"
      | "week"
      | "month"
      | "all",
    direction: (typeof params.direction === "string"
      ? params.direction
      : "all") as PackageDirection,
    page,
    pageSize: PAGE_SIZE,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">
          Liste globale des colis
        </h1>
        <Link
          href="/packages/new"
          className={cn(buttonVariants(), "inline-flex items-center gap-2")}
        >
          <Plus className="h-4 w-4" /> Nouveau colis
        </Link>
      </div>

      <PackagesFilterBar agencies={agencies} />

      {/* Keyed on the filters so React re-suspends and shows the skeleton
          again on every filter/page/direction change, instead of silently waiting. */}
      <Suspense
        key={JSON.stringify(filters) + page}
        fallback={<PackagesResultsSkeleton />}
      >
        <PackagesResults agencyId={agencyId!} filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
