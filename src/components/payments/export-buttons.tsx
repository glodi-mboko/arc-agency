"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  paid: "Payé",
  partial: "Partiel",
  unpaid: "Impayé",
};

// Mirrors the filtering logic in lib/queries/payments.ts (server-only file,
// so it can't be imported directly into this client component).
function periodStartDate(period?: string | null): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

function statusOf(
  totalAmount: number,
  amountPaid: number,
): "paid" | "partial" | "unpaid" {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= totalAmount) return "paid";
  return "partial";
}

export function ExportButtons({ agencyId }: { agencyId: string }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function handleExportCsv() {
    setLoading(true);
    const supabase = createClient();
    const agencyFilter = `origin_agency_id.eq.${agencyId},destination_agency_id.eq.${agencyId}`;

    let query = supabase
      .from("packages")
      .select(
        "tracking_number, total_amount, amount_paid, payment_method, created_at, sender:senders(first_name,last_name)",
      )
      .or(agencyFilter)
      .order("created_at", { ascending: false });

    const trajet = searchParams.get("trajet");
    if (trajet && trajet !== "all") {
      const [originId, destinationId] = trajet.split(":");
      if (originId) query = query.eq("origin_agency_id", originId);
      if (destinationId)
        query = query.eq("destination_agency_id", destinationId);
    }

    const periodStart = periodStartDate(searchParams.get("period"));
    if (periodStart) {
      query = query.gte("created_at", periodStart.toISOString());
    }

    const { data } = await query;
    const statusFilter = searchParams.get("status");

    const rows = (data ?? [])
      .map((p) => {
        const sender = Array.isArray(p.sender) ? p.sender[0] : p.sender;
        const totalAmount = Number(p.total_amount);
        const amountPaid = Number(p.amount_paid);
        return {
          tracking_number: p.tracking_number,
          client:
            `${sender?.first_name ?? ""} ${sender?.last_name ?? ""}`.trim(),
          total_amount: totalAmount,
          amount_paid: amountPaid,
          balance: totalAmount - amountPaid,
          payment_method:
            PAYMENT_METHOD_LABELS[p.payment_method as PaymentMethod] ??
            p.payment_method,
          status: statusOf(totalAmount, amountPaid),
          created_at: new Date(p.created_at).toLocaleDateString("fr-FR"),
        };
      })
      .filter(
        (r) =>
          !statusFilter || statusFilter === "all" || r.status === statusFilter,
      );

    const header = [
      "N° de suivi",
      "Client",
      "Montant total (€)",
      "Montant payé (€)",
      "Solde restant (€)",
      "Mode de paiement",
      "Statut",
      "Date",
    ];

    const csvRows = rows.map((r) => [
      r.tracking_number,
      r.client,
      r.total_amount.toFixed(2),
      r.amount_paid.toFixed(2),
      r.balance.toFixed(2),
      r.payment_method,
      STATUS_LABELS[r.status],
      r.created_at,
    ]);

    const csvContent = [header, ...csvRows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");

    // Leading \uFEFF (BOM) so Excel detects UTF-8 and accents display correctly.
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport-paiements-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button
        type="button"
        variant="outline"
        onClick={handleExportCsv}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        {loading ? "Export..." : "Exporter en Excel"}
      </Button>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <FileText className="h-4 w-4" /> Exporter en PDF
      </Button>
    </div>
  );
}
