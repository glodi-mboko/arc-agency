import { createClient } from "@/lib/supabase/server";
import type { PackageStatus } from "@/lib/types";

export interface PackageListRow {
  id: string;
  tracking_number: string;
  sender_name: string;
  recipient_name: string;
  origin_agency_name: string;
  destination_agency_name: string;
  destination_city: string;
  weight_kg: number;
  status: PackageStatus;
  created_at: string;
}

export type PackageDirection = "all" | "outbound" | "inbound";

export interface PackageListFilters {
  search?: string;
  status?: PackageStatus | "all";
  originAgencyId?: string | "all";
  destinationAgencyId?: string | "all";
  period?: "today" | "week" | "month" | "all";
  direction?: PackageDirection;
  page?: number;
  pageSize?: number;
}

export interface PackageListResult {
  rows: PackageListRow[];
  total: number;
  totalAllTime: number;
  outboundCount: number;
  inboundCount: number;
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

export async function getPackagesList(
  agencyId: string,
  filters: PackageListFilters,
): Promise<PackageListResult> {
  const supabase = await createClient();
  const agencyFilter = `origin_agency_id.eq.${agencyId},destination_agency_id.eq.${agencyId}`;

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 8;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("packages")
    .select(
      "id, tracking_number, status, created_at, weight_kg, sender:senders(first_name,last_name), recipient:recipients(full_name,city), origin_agency:agencies!packages_origin_agency_id_fkey(name), destination_agency:agencies!packages_destination_agency_id_fkey(name)",
      { count: "exact" },
    )
    .or(agencyFilter)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.originAgencyId && filters.originAgencyId !== "all") {
    query = query.eq("origin_agency_id", filters.originAgencyId);
  }
  if (filters.destinationAgencyId && filters.destinationAgencyId !== "all") {
    query = query.eq("destination_agency_id", filters.destinationAgencyId);
  }
  if (filters.direction === "outbound") {
    query = query.eq("origin_agency_id", agencyId);
  } else if (filters.direction === "inbound") {
    query = query.eq("destination_agency_id", agencyId);
  }
  const periodStart = periodStartDate(filters.period);
  if (periodStart) {
    query = query.gte("created_at", periodStart.toISOString());
  }
  if (filters.search) {
    query = query.ilike("tracking_number", `%${filters.search}%`);
  }

  query = query.range(from, to);

  // Run the main query and the 3 summary counts in parallel instead of
  // sequentially - this is what was making filter changes feel slow.
  // The 3 counts stay unaffected by the current filters (they're the
  // stable reference numbers shown on the clickable stat cards).
  const [{ data, count }, totalAllTimeRes, outboundRes, inboundRes] =
    await Promise.all([
      query,
      supabase
        .from("packages")
        .select("id", { count: "exact", head: true })
        .or(agencyFilter),
      supabase
        .from("packages")
        .select("id", { count: "exact", head: true })
        .eq("origin_agency_id", agencyId),
      supabase
        .from("packages")
        .select("id", { count: "exact", head: true })
        .eq("destination_agency_id", agencyId),
    ]);

  const rows: PackageListRow[] = (data ?? []).map((p) => {
    const sender = Array.isArray(p.sender) ? p.sender[0] : p.sender;
    const recipient = Array.isArray(p.recipient) ? p.recipient[0] : p.recipient;
    const originAgency = Array.isArray(p.origin_agency)
      ? p.origin_agency[0]
      : p.origin_agency;
    const destinationAgency = Array.isArray(p.destination_agency)
      ? p.destination_agency[0]
      : p.destination_agency;
    return {
      id: p.id,
      tracking_number: p.tracking_number,
      sender_name:
        `${sender?.first_name ?? ""} ${sender?.last_name ?? ""}`.trim(),
      recipient_name: recipient?.full_name ?? "",
      origin_agency_name: originAgency?.name ?? "",
      destination_agency_name: destinationAgency?.name ?? "",
      destination_city: recipient?.city ?? "",
      weight_kg: Number(p.weight_kg),
      status: p.status,
      created_at: p.created_at,
    };
  });

  return {
    rows,
    total: count ?? 0,
    totalAllTime: totalAllTimeRes.count ?? 0,
    outboundCount: outboundRes.count ?? 0,
    inboundCount: inboundRes.count ?? 0,
  };
}
