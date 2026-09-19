"use server";

import { randomUUID } from "node:crypto";

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

  // senders/recipients can only be read back (SELECT policy) once a package
  // links to them, so right after inserting them there is no package yet
  // that would make the row visible. Postgres enforces that same SELECT
  // policy on the RETURNING clause of INSERT ... RETURNING, which is what
  // made `.insert().select()` fail with "new row violates row-level
  // security policy" even though the INSERT itself was allowed. Generating
  // the id ourselves and skipping `.select()` avoids the RETURNING step
  // (and the SELECT-policy check that comes with it) entirely.
  const senderId = randomUUID();
  const { error: senderError } = await supabase.from("senders").insert({
    id: senderId,
    last_name: input.lastName,
    middle_name: input.middleName,
    first_name: input.firstName,
    street: input.street,
    neighborhood: input.neighborhood,
    city: input.city,
    id_type: input.idType,
    id_number: input.idNumber,
    whatsapp: input.whatsapp,
  });

  if (senderError) {
    console.error("createPackage: senders insert failed", senderError);
    return {
      error: `Impossible d'enregistrer l'expéditeur. ${senderError.message}`,
    };
  }

  const { data: destinationAgency } = await supabase
    .from("agencies")
    .select("country")
    .eq("id", input.destinationAgencyId)
    .single();

  const recipientId = randomUUID();
  const { error: recipientError } = await supabase.from("recipients").insert({
    id: recipientId,
    full_name: input.recipientFullName,
    phone: input.recipientPhone,
    country: destinationAgency?.country ?? "",
    city: input.recipientCity,
  });

  if (recipientError) {
    console.error("createPackage: recipients insert failed", recipientError);
    return {
      error: `Impossible d'enregistrer le destinataire. ${recipientError.message}`,
    };
  }

  const totalAmount = input.weightKg * input.pricePerKg;

  const { data: pkg, error: packageError } = await supabase
    .from("packages")
    .insert({
      origin_agency_id: input.originAgencyId,
      destination_agency_id: input.destinationAgencyId,
      sender_id: senderId,
      recipient_id: recipientId,
      package_type: input.packageTypeName,
      details: input.details,
      weight_kg: input.weightKg,
      price_per_kg: input.pricePerKg,
      price_per_kg_currency: input.currency,
      total_amount: totalAmount,
      payment_method: input.paymentMethod,
      amount_paid: input.amountPaid,
      // Must match auth.uid() for the "Agents can create packages for their
      // agencies" policy's WITH CHECK — the session's own id, not whatever
      // the client happened to send.
      agent_id: user.id,
    })
    .select()
    .single();

  if (packageError || !pkg) {
    console.error("createPackage: packages insert failed", packageError);
    return {
      error: `Impossible d'enregistrer le colis. ${packageError?.message ?? "Réessayez."}`,
    };
  }

  if (input.amountPaid > 0) {
    await supabase.from("payments").insert({
      package_id: pkg.id,
      amount: input.amountPaid,
      payment_method: input.paymentMethod,
      location_agency_id: input.paymentLocationAgencyId,
      agent_id: user.id,
    });
  }

  return { data: { id: pkg.id, tracking_number: pkg.tracking_number } };
}
