import { createClient } from "@/lib/supabase/server";
import type { PackageStatus } from "@/lib/types";

export interface RecentPackageRow {
  id: string;
  tracking_number: string;
  sender_name: string;
  recipient_name: string;
  status: PackageStatus;
  created_at: string;
}

export interface DashboardStats {
  totalPackages: number;
  totalPackagesChange: number | null;
  totalWeight: number;
  totalWeightChange: number | null;
  revenue: number;
  revenueChange: number | null;
  pending: number;
  recentPackages: RecentPackageRow[];
  weeklyCounts: { week: string; count: number }[];
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getDashboardStats(
  agencyId: string,
): Promise<DashboardStats> {
  const supabase = await createClient();
  const agencyFilter = `origin_agency_id.eq.${agencyId},destination_agency_id.eq.${agencyId}`;

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  // Packages from the last 2 months, used to compute this-month vs last-month stats
  const { data: windowPackages } = await supabase
    .from("packages")
    .select("id, weight_kg, amount_paid, created_at")
    .or(agencyFilter)
    .gte("created_at", lastMonthStart.toISOString());

  const rows = windowPackages ?? [];
  const thisMonthRows = rows.filter(
    (r) => new Date(r.created_at) >= thisMonthStart,
  );
  const lastMonthRows = rows.filter(
    (r) =>
      new Date(r.created_at) >= lastMonthStart &&
      new Date(r.created_at) < thisMonthStart,
  );

  const sum = (arr: typeof rows, key: "weight_kg" | "amount_paid") =>
    arr.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

  const totalPackages = thisMonthRows.length;
  const totalWeight = sum(thisMonthRows, "weight_kg");
  const revenue = sum(thisMonthRows, "amount_paid");

  const totalPackagesChange = percentChange(
    totalPackages,
    lastMonthRows.length,
  );
  const totalWeightChange = percentChange(
    totalWeight,
    sum(lastMonthRows, "weight_kg"),
  );
  const revenueChange = percentChange(
    revenue,
    sum(lastMonthRows, "amount_paid"),
  );

  // Pending = registered / in_transit / arrived (not yet picked up), all-time
  const { count: pending } = await supabase
    .from("packages")
    .select("id", { count: "exact", head: true })
    .or(agencyFilter)
    .neq("status", "picked_up");

  // 5 most recent packages, with sender/recipient names
  const { data: recentRaw } = await supabase
    .from("packages")
    .select(
      "id, tracking_number, status, created_at, sender:senders(first_name,last_name), recipient:recipients(full_name)",
    )
    .or(agencyFilter)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentPackages: RecentPackageRow[] = (recentRaw ?? []).map((p) => {
    const sender = Array.isArray(p.sender) ? p.sender[0] : p.sender;
    const recipient = Array.isArray(p.recipient) ? p.recipient[0] : p.recipient;
    return {
      id: p.id,
      tracking_number: p.tracking_number,
      sender_name: `${sender?.first_name ?? ""} ${
        sender?.last_name ?? ""
      }`.trim(),
      recipient_name: recipient?.full_name ?? "",
      status: p.status,
      created_at: p.created_at,
    };
  });

  // Packages per week, last 6 weeks
  const sixWeeksAgo = new Date(now);
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 7 * 6);

  const { data: weeklyRaw } = await supabase
    .from("packages")
    .select("created_at")
    .or(agencyFilter)
    .gte("created_at", sixWeeksAgo.toISOString());

  const buckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) buckets.set(`S${i + 1}`, 0);

  (weeklyRaw ?? []).forEach((row) => {
    const created = new Date(row.created_at);
    const diffWeeks = Math.floor(
      (now.getTime() - created.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    const bucketIndex = 5 - diffWeeks; // 5 = oldest bucket, 0 = current week
    if (bucketIndex >= 0 && bucketIndex <= 5) {
      const label = `S${bucketIndex + 1}`;
      buckets.set(label, (buckets.get(label) ?? 0) + 1);
    }
  });

  const weeklyCounts = Array.from(buckets.entries()).map(([week, count]) => ({
    week,
    count,
  }));

  return {
    totalPackages,
    totalPackagesChange,
    totalWeight,
    totalWeightChange,
    revenue,
    revenueChange,
    pending: pending ?? 0,
    recentPackages,
    weeklyCounts,
  };
}
