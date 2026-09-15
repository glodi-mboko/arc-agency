import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/types";

export type PaymentStatusFilter = "all" | "paid" | "partial" | "unpaid";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface PaymentRow {
  id: string;
  tracking_number: string;
  client_name: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
}

export interface PaymentsFilters {
  period?: "today" | "week" | "month" | "all";
  trajet?: string; // "originAgencyId:destinationAgencyId" or "all"
  paymentStatus?: PaymentStatusFilter;
  page?: number;
  pageSize?: number;
}

export interface PaymentsReport {
  rows: PaymentRow[];
  total: number;
  totalCollected: number;
  totalOutstanding: number;
  totalAmountSum: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

function periodStartDate(period?: string): Date | null {
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

export function statusOf(
  totalAmount: number,
  amountPaid: number,
): PaymentStatus {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= totalAmount) return "paid";
  return "partial";
}

export async function getPaymentsReport(
  agencyId: string,
  filters: PaymentsFilters,
): Promise<PaymentsReport> {
  const supabase = await createClient();
  const agencyFilter = `origin_agency_id.eq.${agencyId},destination_agency_id.eq.${agencyId}`;

  let query = supabase
    .from("packages")
    .select(
      "id, tracking_number, total_amount, amount_paid, payment_method, created_at, sender:senders(first_name,last_name)",
    )
    .or(agencyFilter)
    .order("created_at", { ascending: false });

  if (filters.trajet && filters.trajet !== "all") {
    const [originId, destinationId] = filters.trajet.split(":");
    if (originId) query = query.eq("origin_agency_id", originId);
    if (destinationId) query = query.eq("destination_agency_id", destinationId);
  }

  const periodStart = periodStartDate(filters.period);
  if (periodStart) {
    query = query.gte("created_at", periodStart.toISOString());
  }

  const { data } = await query;

  // Payment status is derived (not a DB column comparing two columns is
  // awkward via PostgREST), so we filter it in memory here. Fine at this
  // data volume; worth revisiting with a DB view if the table grows a lot.
  const allRows: PaymentRow[] = (data ?? []).map((p) => {
    const sender = Array.isArray(p.sender) ? p.sender[0] : p.sender;
    const totalAmount = Number(p.total_amount);
    const amountPaid = Number(p.amount_paid);
    return {
      id: p.id,
      tracking_number: p.tracking_number,
      client_name:
        `${sender?.first_name ?? ""} ${sender?.last_name ?? ""}`.trim(),
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance: totalAmount - amountPaid,
      payment_method: p.payment_method,
      status: statusOf(totalAmount, amountPaid),
      created_at: p.created_at,
    };
  });

  const filteredRows =
    filters.paymentStatus && filters.paymentStatus !== "all"
      ? allRows.filter((r) => r.status === filters.paymentStatus)
      : allRows;

  const totalCollected = filteredRows.reduce(
    (acc, r) => acc + r.amount_paid,
    0,
  );
  const totalOutstanding = filteredRows.reduce(
    (acc, r) => acc + Math.max(r.balance, 0),
    0,
  );
  const totalAmountSum = filteredRows.reduce(
    (acc, r) => acc + r.total_amount,
    0,
  );
  const paidCount = filteredRows.filter((r) => r.status === "paid").length;
  const partialCount = filteredRows.filter(
    (r) => r.status === "partial",
  ).length;
  const unpaidCount = filteredRows.filter((r) => r.status === "unpaid").length;

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);

  return {
    rows: pageRows,
    total: filteredRows.length,
    totalCollected,
    totalOutstanding,
    totalAmountSum,
    paidCount,
    partialCount,
    unpaidCount,
  };
}
