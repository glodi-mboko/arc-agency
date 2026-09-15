import { createClient } from "@/lib/supabase/server";
import type { PackageStatus, IdType, PaymentMethod } from "@/lib/types";

export interface PaymentHistoryRow {
  id: string;
  amount: number;
  payment_method: PaymentMethod;
  location_agency_name: string;
  created_at: string;
}

export interface PackageDetail {
  id: string;
  tracking_number: string;
  status: PackageStatus;
  created_at: string;
  package_type: string;
  weight_kg: number;
  price_per_kg: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  sender: {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    street: string | null;
    neighborhood: string | null;
    city: string | null;
    whatsapp: string;
    id_type: IdType;
    id_number: string;
  };
  recipient: {
    full_name: string;
    phone: string;
    country: string;
    city: string;
  };
  origin_agency_id: string;
  destination_agency_id: string;
  origin_agency: { name: string; city: string; country: string };
  destination_agency: { name: string; city: string; country: string };
  status_history: {
    status: PackageStatus;
    location: string | null;
    comment: string | null;
    created_at: string;
  }[];
  payments: PaymentHistoryRow[];
}

export async function getPackageDetail(
  id: string,
): Promise<PackageDetail | null> {
  const supabase = await createClient();

  const { data: pkg, error } = await supabase
    .from("packages")
    .select(
      "id, tracking_number, status, created_at, package_type, weight_kg, price_per_kg, total_amount, payment_method, amount_paid, origin_agency_id, destination_agency_id, sender:senders(first_name,last_name,middle_name,street,neighborhood,city,whatsapp,id_type,id_number), recipient:recipients(full_name,phone,country,city), origin_agency:agencies!packages_origin_agency_id_fkey(name,city,country), destination_agency:agencies!packages_destination_agency_id_fkey(name,city,country)",
    )
    .eq("id", id)
    .single();

  if (error || !pkg) return null;

  const [{ data: history }, { data: payments }] = await Promise.all([
    supabase
      .from("status_history")
      .select("status, location, comment, created_at")
      .eq("package_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("payments")
      .select(
        "id, amount, payment_method, created_at, location_agency:agencies(name)",
      )
      .eq("package_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const sender = Array.isArray(pkg.sender) ? pkg.sender[0] : pkg.sender;
  const recipient = Array.isArray(pkg.recipient)
    ? pkg.recipient[0]
    : pkg.recipient;
  const originAgency = Array.isArray(pkg.origin_agency)
    ? pkg.origin_agency[0]
    : pkg.origin_agency;
  const destinationAgency = Array.isArray(pkg.destination_agency)
    ? pkg.destination_agency[0]
    : pkg.destination_agency;

  const paymentRows: PaymentHistoryRow[] = (payments ?? []).map((p) => {
    const locationAgency = Array.isArray(p.location_agency)
      ? p.location_agency[0]
      : p.location_agency;
    return {
      id: p.id,
      amount: Number(p.amount),
      payment_method: p.payment_method,
      location_agency_name: locationAgency?.name ?? "—",
      created_at: p.created_at,
    };
  });

  return {
    id: pkg.id,
    tracking_number: pkg.tracking_number,
    status: pkg.status,
    created_at: pkg.created_at,
    package_type: pkg.package_type,
    weight_kg: Number(pkg.weight_kg),
    price_per_kg: Number(pkg.price_per_kg),
    total_amount: Number(pkg.total_amount),
    payment_method: pkg.payment_method,
    amount_paid: Number(pkg.amount_paid),
    origin_agency_id: pkg.origin_agency_id,
    destination_agency_id: pkg.destination_agency_id,
    sender,
    recipient,
    origin_agency: originAgency,
    destination_agency: destinationAgency,
    status_history: history ?? [],
    payments: paymentRows,
  };
}
