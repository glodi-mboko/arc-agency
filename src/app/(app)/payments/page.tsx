import { Suspense } from "react";

import { getActiveAgencyId } from "@/lib/queries/current-agent";
import { getAllAgencies } from "@/lib/queries/agencies";
import type {
  PaymentsFilters,
  PaymentStatusFilter,
} from "@/lib/queries/payments";
import { PaymentsFilterBar } from "@/components/payments/payments-filter-bar";
import { PaymentsResults } from "@/components/payments/payments-results";
import { ExportButtons } from "@/components/payments/export-buttons";
import { PackagesResultsSkeleton } from "@/components/packages/packages-results-skeleton";

const PAGE_SIZE = 10;

export default async function PaymentsPage({
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
  const filters: PaymentsFilters = {
    period: (typeof params.period === "string" ? params.period : "all") as
      | "today"
      | "week"
      | "month"
      | "all",
    trajet: typeof params.trajet === "string" ? params.trajet : "all",
    paymentStatus: (typeof params.status === "string"
      ? params.status
      : "all") as PaymentStatusFilter,
    page,
    pageSize: PAGE_SIZE,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">
          Rapport de paiements
        </h1>
        <ExportButtons agencyId={agencyId!} />
      </div>

      <PaymentsFilterBar agencies={agencies} />

      <Suspense
        key={JSON.stringify(filters) + page}
        fallback={<PackagesResultsSkeleton />}
      >
        <PaymentsResults agencyId={agencyId!} filters={filters} page={page} />
      </Suspense>
    </div>
  );
}
