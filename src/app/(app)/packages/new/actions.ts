"use server";

import { createClient } from "@/lib/supabase/server";
import type { IdType, PaymentMethod } from "@/lib/types";

interface CreatePackageInput {
  originAgencyId: string;
  destinationAgencyId: string;
  lastName: string;
  middleName: string | null;
  firstName: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  idType: IdType;
  idNumber: string | null;
  whatsapp: string;

  recipientFullName: string;
  recipientPhone: string;
  recipientCity: string | null;

  packageTypeName: string;
  details: string | null;
  weightKg: number;
  pricePerKg: number;
  currency: "USD" | "EUR";
  paymentMethod: PaymentMethod;
  paymentLocationAgencyId: string;
  amountPaid: number;
  agentId: string;
}

interface CreatePackageResult {
  data?: { id: string; tracking_number: string };
  error?: string;
}

export async function createPackage(
  input: CreatePackageInput,
): Promise<CreatePackageResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée, merci de vous reconnecter." };
  }

  const { data: sender, error: senderError } = await supabase
    .from("senders")
    .insert({
      last_name: input.lastName,
      middle_name: input.middleName,
      first_name: input.firstName,
      street: input.street,
      neighborhood: input.neighborhood,
      city: input.city,
      id_type: input.idType,
      id_number: input.idNumber,
      whatsapp: input.whatsapp,
    })
    .select()
    .single();

  if (senderError || !sender) {
    return { error: "Impossible d'enregistrer l'expéditeur. Réessayez." };
  }

  const { data: destinationAgency } = await supabase
    .from("agencies")
    .select("country")
    .eq("id", input.destinationAgencyId)
    .single();

  const { data: recipient, error: recipientError } = await supabase
    .from("recipients")
    .insert({
      full_name: input.recipientFullName,
      phone: input.recipientPhone,
      country: destinationAgency?.country ?? "",
      city: input.recipientCity,
    })
    .select()
    .single();

  if (recipientError || !recipient) {
    return { error: "Impossible d'enregistrer le destinataire. Réessayez." };
  }

  const totalAmount = input.weightKg * input.pricePerKg;

  const { data: pkg, error: packageError } = await supabase
    .from("packages")
    .insert({
      origin_agency_id: input.originAgencyId,
      destination_agency_id: input.destinationAgencyId,
      sender_id: sender.id,
      recipient_id: recipient.id,
      package_type: input.packageTypeName,
      details: input.details,
      weight_kg: input.weightKg,
      price_per_kg: input.pricePerKg,
      price_per_kg_currency: input.currency,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      amount_paid: input.amountPaid,
      agent_id: input.agentId,
    })
    .select()
    .single();

  if (packageError || !pkg) {
    return { error: "Impossible d'enregistrer le colis. Réessayez." };
  }

  if (input.amountPaid > 0) {
    await supabase.from("payments").insert({
      package_id: pkg.id,
      amount: input.amountPaid,
      payment_method: input.paymentMethod,
      location_agency_id: input.paymentLocationAgencyId,
      agent_id: input.agentId,
    });
  }

  return { data: { id: pkg.id, tracking_number: pkg.tracking_number } };
}
