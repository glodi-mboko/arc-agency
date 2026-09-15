import { Wallet, AlertCircle, CheckCircle2, Clock } from "lucide-react";

import {
  getPaymentsReport,
  type PaymentsFilters,
} from "@/lib/queries/payments";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { PaginationControls } from "@/components/packages/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-600/10 text-green-700",
  partial: "bg-accent/10 text-accent",
  unpaid: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Payé",
  partial: "Partiel",
  unpaid: "Impayé",
};

interface PaymentsResultsProps {
  agencyId: string;
  filters: PaymentsFilters;
  page: number;
}

export async function PaymentsResults({
  agencyId,
  filters,
  page,
}: PaymentsResultsProps) {
  const report = await getPaymentsReport(agencyId, filters);
  const totalPages = Math.max(1, Math.ceil(report.total / PAGE_SIZE));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Total encaissé
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {report.totalCollected.toLocaleString("fr-FR")} €
              </div>
            </div>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Solde restant à percevoir
              </div>
              <div className="text-2xl font-bold text-accent mt-1">
                {report.totalOutstanding.toLocaleString("fr-FR")} €
              </div>
            </div>
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Paiements complets
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {report.paidCount}
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                Paiements partiels
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {report.partialCount}
              </div>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">N° de suivi</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Montant total</th>
                  <th className="px-4 py-3 font-medium">Montant payé</th>
                  <th className="px-4 py-3 font-medium">Solde restant</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      Aucun paiement ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  report.rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {r.tracking_number}
                      </td>
                      <td className="px-4 py-3">{r.client_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.total_amount.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-green-700">
                        {r.amount_paid.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.balance > 0 ? (
                          <span className="text-accent font-medium">
                            {r.balance.toFixed(2)} €
                          </span>
                        ) : (
                          "0,00 €"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {PAYMENT_METHOD_LABELS[r.payment_method]}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            STATUS_STYLES[r.status],
                          )}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {report.rows.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td className="px-4 py-3" colSpan={2}>
                      Total ({report.total} paiement
                      {report.total > 1 ? "s" : ""})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {report.totalAmountSum.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-green-700">
                      {report.totalCollected.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-accent">
                      {report.totalOutstanding.toFixed(2)} €
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm text-muted-foreground print:hidden">
            <span>
              Affichage de{" "}
              {report.rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} à{" "}
              {(page - 1) * PAGE_SIZE + report.rows.length} sur {report.total}{" "}
              résultats
            </span>
            <PaginationControls page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
