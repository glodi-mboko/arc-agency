"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { KINSHASA_COMMUNES } from "@/lib/constants/kinshasa-communes";
import {
  ID_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Agency,
  type Package,
} from "@/lib/types";
import type { PackageType } from "@/lib/queries/package-types";

const DRC_COUNTRY_NAME = "République Démocratique du Congo";

const packageFormSchema = z
  .object({
    originAgencyId: z.string().min(1, "Choisissez l'agence d'origine"),
    destinationAgencyId: z
      .string()
      .min(1, "Choisissez l'agence de destination"),
    lastName: z.string().min(1, "Le nom est requis"),
    middleName: z.string().optional(),
    firstName: z.string().min(1, "Le prénom est requis"),
    street: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    idType: z.string().min(1, "Le type de pièce est requis"),
    idNumber: z.string().optional(),
    whatsapp: z.string().min(1, "Le WhatsApp est requis"),

    recipientFullName: z.string().min(1, "Le nom du destinataire est requis"),
    recipientPhone: z.string().min(1, "Le téléphone est requis"),
    recipientCity: z.string().optional(),
    recipientCountry: z.string(),
    details: z.string().optional(),

    packageTypeId: z.string().min(1, "Type de colis requis"),
    weightKg: z
      .string()
      .min(1, "Poids requis")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        "Le poids doit être positif",
      ),
    pricePerKg: z
      .string()
      .min(1, "Prix requis")
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) > 0,
        "Le prix doit être positif",
      ),
    paymentMethod: z.enum(["cash", "mobile_money", "card"]),
    paymentLocation: z.enum(["origin", "destination"]),
    amountPaid: z
      .string()
      .refine(
        (v) => !isNaN(Number(v)) && Number(v) >= 0,
        "Ne peut pas être négatif",
      ),
  })
  .refine((data) => data.originAgencyId !== data.destinationAgencyId, {
    message: "L'origine et la destination doivent être différentes",
    path: ["destinationAgencyId"],
  });

type PackageFormValues = z.infer<typeof packageFormSchema>;

interface NewPackageFormProps {
  agencies: Agency[];
  packageTypes: PackageType[];
  defaultOriginId: string;
  agentId: string;
}

export function NewPackageForm({
  agencies,
  packageTypes,
  defaultOriginId,
  agentId,
}: NewPackageFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdPackage, setCreatedPackage] = useState<Package | null>(null);

  const defaultDestination =
    agencies.find((a) => a.id !== defaultOriginId)?.id ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      originAgencyId: defaultOriginId,
      destinationAgencyId: defaultDestination,
      idType: "passport",
      paymentMethod: "cash",
      paymentLocation: "origin",
      amountPaid: "0",
      packageTypeId: packageTypes[0]?.id ?? "",
    },
  });

  const weightKg = Number(watch("weightKg")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const amountPaid = Number(watch("amountPaid")) || 0;
  const originAgencyId = watch("originAgencyId");
  const destinationAgencyId = watch("destinationAgencyId");

  const totalAmount = weightKg * pricePerKg;
  const balance = totalAmount - amountPaid;
  const originAgency = agencies.find((a) => a.id === originAgencyId);
  const destinationAgency = agencies.find((a) => a.id === destinationAgencyId);
  const originIsDRC = originAgency?.country === DRC_COUNTRY_NAME;
  const destinationIsDRC = destinationAgency?.country === DRC_COUNTRY_NAME;

  const originReg = register("originAgencyId");
  const destinationReg = register("destinationAgencyId");

  function handleOriginChange(e: React.ChangeEvent<HTMLSelectElement>) {
    originReg.onChange(e);
    const newOrigin = e.target.value;
    if (newOrigin === watch("destinationAgencyId")) {
      const other = agencies.find((a) => a.id !== newOrigin);
      if (other) setValue("destinationAgencyId", other.id);
    }
  }

  function handleDestinationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    destinationReg.onChange(e);
    const newDestination = e.target.value;
    if (newDestination === watch("originAgencyId")) {
      const other = agencies.find((a) => a.id !== newDestination);
      if (other) setValue("originAgencyId", other.id);
    }
  }

  async function onSubmit(values: PackageFormValues) {
    setServerError(null);
    const supabase = createClient();

    const { data: sender, error: senderError } = await supabase
      .from("senders")
      .insert({
        last_name: values.lastName,
        middle_name: values.middleName || null,
        first_name: values.firstName,
        street: values.street || null,
        neighborhood: values.neighborhood || null,
        city: values.city || null,
        id_type: values.idType,
        id_number: values.idNumber || null,
        whatsapp: values.whatsapp,
      })
      .select()
      .single();

    if (senderError || !sender) {
      setServerError("Impossible d'enregistrer l'expéditeur. Réessayez.");
      return;
    }

    // Country is derived from the destination agency, not entered manually.
    const recipientCountry =
      agencies.find((a) => a.id === values.destinationAgencyId)?.country ?? "";

    const { data: recipient, error: recipientError } = await supabase
      .from("recipients")
      .insert({
        full_name: values.recipientFullName,
        phone: values.recipientPhone,
        country: recipientCountry,
        city: values.recipientCity || null,
      })
      .select()
      .single();

    if (recipientError || !recipient) {
      setServerError("Impossible d'enregistrer le destinataire. Réessayez.");
      return;
    }

    const weightKgValue = Number(values.weightKg);
    const pricePerKgValue = Number(values.pricePerKg);
    const amountPaidValue = Number(values.amountPaid);
    const packageTypeName =
      packageTypes.find((t) => t.id === values.packageTypeId)?.name ?? "";

    const { data: pkg, error: packageError } = await supabase
      .from("packages")
      .insert({
        origin_agency_id: values.originAgencyId,
        destination_agency_id: values.destinationAgencyId,
        sender_id: sender.id,
        recipient_id: recipient.id,
        package_type: packageTypeName,
        weight_kg: weightKgValue,
        price_per_kg: pricePerKgValue,
        total_amount: weightKgValue * pricePerKgValue,
        payment_method: values.paymentMethod,
        amount_paid: amountPaidValue,
        agent_id: agentId,
        details: values.details || null,
      })
      .select()
      .single();

    if (packageError || !pkg) {
      setServerError("Impossible d'enregistrer le colis. Réessayez.");
      return;
    }

    if (amountPaidValue > 0) {
      const locationAgencyId =
        values.paymentLocation === "origin"
          ? values.originAgencyId
          : values.destinationAgencyId;

      await supabase.from("payments").insert({
        package_id: pkg.id,
        amount: amountPaidValue,
        payment_method: values.paymentMethod,
        location_agency_id: locationAgencyId,
        agent_id: agentId,
      });
    }

    setCreatedPackage(pkg);
  }

  if (createdPackage) {
    return (
      <Card className="max-w-lg">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold text-primary">Colis enregistré !</h2>
          <div className="bg-muted rounded-md py-3">
            <div className="text-xs text-muted-foreground">Numéro de suivi</div>
            <div className="text-lg font-bold text-primary">
              {createdPackage.tracking_number}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreatedPackage(null);
                reset();
              }}
            >
              Enregistrer un autre colis
            </Button>
            <Link href="/dashboard" className={cn(buttonVariants())}>
              Retour au tableau de bord
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* 0. Trajet */}
      <Card>
        <CardHeader>
          <CardTitle>0. Sélection du trajet</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="originAgencyId">Origine</Label>
            <NativeSelect
              id="originAgencyId"
              name={originReg.name}
              ref={originReg.ref}
              onBlur={originReg.onBlur}
              value={originAgencyId}
              onChange={handleOriginChange}
            >
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}, {a.country}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destinationAgencyId">Destination</Label>
            <NativeSelect
              id="destinationAgencyId"
              name={destinationReg.name}
              ref={destinationReg.ref}
              onBlur={destinationReg.onBlur}
              value={destinationAgencyId}
              onChange={handleDestinationChange}
            >
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}, {a.country}
                </option>
              ))}
            </NativeSelect>
            {errors.destinationAgencyId && (
              <p className="text-xs text-destructive">
                {errors.destinationAgencyId.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1. Expéditeur */}
      <Card>
        <CardHeader>
          <CardTitle>1. Informations Expéditeur</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              {...register("lastName")}
              placeholder="Saisir le nom"
            />
            {errors.lastName && (
              <p className="text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Postnom</Label>
            <Input
              id="middleName"
              {...register("middleName")}
              placeholder="Saisir le postnom (optionnel)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              {...register("firstName")}
              placeholder="Saisir le prénom"
            />
            {errors.firstName && (
              <p className="text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Avenue / Rue</Label>
            <Input
              id="street"
              {...register("street")}
              placeholder="Ex: 12 Rue de la Paix"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Quartier / Code Postal</Label>
            <Input
              id="neighborhood"
              {...register("neighborhood")}
              placeholder="Ex: 75002"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Commune / Ville</Label>
            {originIsDRC ? (
              <NativeSelect id="city" {...register("city")}>
                <option value="">Choisir une commune</option>
                {KINSHASA_COMMUNES.map((commune) => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <Input id="city" {...register("city")} placeholder="Ex: Paris" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idType">Type de pièce d&apos;identité</Label>
            <NativeSelect id="idType" {...register("idType")}>
              {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idNumber">Numéro de pièce d&apos;identité</Label>
            <Input
              id="idNumber"
              {...register("idNumber")}
              placeholder="Ex: FR8923412"
            />
            {errors.idNumber && (
              <p className="text-xs text-destructive">
                {errors.idNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Numéro WhatsApp (Expéditeur)</Label>
            <Input
              id="whatsapp"
              {...register("whatsapp")}
              placeholder="Ex: +33 6 12 34 56 78"
            />
            {errors.whatsapp && (
              <p className="text-xs text-destructive">
                {errors.whatsapp.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Destinataire */}
      <Card>
        <CardHeader>
          <CardTitle>2. Informations Destinataire</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipientFullName">
              Nom complet du destinataire
            </Label>
            <Input
              id="recipientFullName"
              {...register("recipientFullName")}
              placeholder="Nom, Postnom & Prénom"
            />
            {errors.recipientFullName && (
              <p className="text-xs text-destructive">
                {errors.recipientFullName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientPhone">
              Numéro de téléphone / WhatsApp
            </Label>
            <Input
              id="recipientPhone"
              {...register("recipientPhone")}
              placeholder="Ex: +243 81 234 5678"
            />
            {errors.recipientPhone && (
              <p className="text-xs text-destructive">
                {errors.recipientPhone.message}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Pays de destination</Label>
            <Input
              readOnly
              value={destinationAgency?.country ?? ""}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Déterminé automatiquement par l&apos;agence de destination choisie
              ci-dessus.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="recipientCity">Ville</Label>
            {destinationIsDRC ? (
              <NativeSelect id="recipientCity" {...register("recipientCity")}>
                <option value="">Choisir une commune</option>
                {KINSHASA_COMMUNES.map((commune) => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <Input
                id="recipientCity"
                {...register("recipientCity")}
                placeholder="Ex: Kinshasa"
              />
            )}
            {errors.recipientCity && (
              <p className="text-xs text-destructive">
                {errors.recipientCity.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Colis & Paiement */}
      <Card>
        <CardHeader>
          <CardTitle>3. Détails Colis &amp; Paiement</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="packageTypeId">Type de colis</Label>
            <NativeSelect id="packageTypeId" {...register("packageTypeId")}>
              {packageTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
            {errors.packageTypeId && (
              <p className="text-xs text-destructive">
                {errors.packageTypeId.message}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="details">Détail du colis</Label>
            <textarea
              id="details"
              {...register("details")}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Description du contenu, précisions particulières..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightKg">Poids (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              step="0.1"
              {...register("weightKg")}
            />
            {errors.weightKg && (
              <p className="text-xs text-destructive">
                {errors.weightKg.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerKg">Prix au kg (€)</Label>
            <Input
              id="pricePerKg"
              type="number"
              step="0.1"
              {...register("pricePerKg")}
            />
            {errors.pricePerKg && (
              <p className="text-xs text-destructive">
                {errors.pricePerKg.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-4">
            <Label>Montant total (€)</Label>
            <Input
              readOnly
              value={`${totalAmount.toFixed(2)} € (calculé)`}
              className="bg-muted"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Mode de paiement</Label>
            <div className="flex gap-4 h-10 items-center">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value={value}
                    {...register("paymentMethod")}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="paymentLocation">Lieu de paiement</Label>
            <NativeSelect id="paymentLocation" {...register("paymentLocation")}>
              <option value="origin">
                Origine — {originAgency?.name ?? "..."}
              </option>
              <option value="destination">
                Destination — {destinationAgency?.name ?? "..."}
              </option>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountPaid">Montant payé (€)</Label>
            <Input
              id="amountPaid"
              type="number"
              step="0.1"
              {...register("amountPaid")}
            />
            {errors.amountPaid && (
              <p className="text-xs text-destructive">
                {errors.amountPaid.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Solde restant</Label>
            <div
              className={`h-10 flex items-center px-3 rounded-md text-sm font-medium ${
                balance > 0
                  ? "bg-accent/10 text-accent"
                  : "bg-green-600/10 text-green-700"
              }`}
            >
              {balance > 0
                ? `${balance.toFixed(2)} € à payer${
                    destinationAgency ? ` à ${destinationAgency.name}` : ""
                  }`
                : "Payé intégralement"}
            </div>
          </div>
        </CardContent>
      </Card>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Annuler
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer le colis"}
        </Button>
      </div>
    </form>
  );
}
