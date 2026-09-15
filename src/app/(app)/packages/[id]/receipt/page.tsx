import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getPackageDetail } from "@/lib/queries/package-detail";
import { PAYMENT_METHOD_LABELS, PACKAGE_STATUS_LABELS } from "@/lib/types";
import { ReceiptQrCode } from "@/components/packages/receipt-qr-code";
import { PrintButton } from "@/components/packages/print-button";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = await getPackageDetail(id);
  if (!pkg) notFound();

  const balance = pkg.total_amount - pkg.amount_paid;
  const senderFullName = [
    pkg.sender.first_name,
    pkg.sender.middle_name,
    pkg.sender.last_name,
  ]
    .filter(Boolean)
    .join(" ");
  const senderAddress =
    [pkg.sender.street, pkg.sender.neighborhood, pkg.sender.city]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <div className="p-6 print:p-0">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link
          href={`/packages/${pkg.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au colis
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-8 shadow-sm print:shadow-none print:border-0 print:max-w-none print:mx-0 print:p-0">
        <div className="flex items-start justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              ARC
            </div>
            <div>
              <div className="font-bold text-primary">ARC Service</div>
              <div className="text-xs text-muted-foreground">
                Agence {pkg.origin_agency.name} → {pkg.destination_agency.name}
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent whitespace-nowrap">
            REÇU DE DÉPÔT
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="text-xs text-muted-foreground tracking-widest font-semibold">
            NUMÉRO DE SUIVI
          </div>
          <div className="text-3xl font-bold text-primary mt-1">
            {pkg.tracking_number}
          </div>
          <div className="text-sm text-green-700 mt-1">
            ● {PACKAGE_STATUS_LABELS[pkg.status]} ·{" "}
            {new Date(pkg.created_at).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted rounded-md p-4">
            <div className="text-xs font-semibold text-muted-foreground border-b border-border pb-2 mb-2">
              Expéditeur
            </div>
            <div className="text-sm font-medium text-foreground">
              {senderFullName}
            </div>
            <div className="text-sm text-muted-foreground">{senderAddress}</div>
            <div className="text-sm text-muted-foreground">
              Tél. / WhatsApp : {pkg.sender.whatsapp}
            </div>
          </div>
          <div className="bg-muted rounded-md p-4">
            <div className="text-xs font-semibold text-muted-foreground border-b border-border pb-2 mb-2">
              Destinataire
            </div>
            <div className="text-sm font-medium text-foreground">
              {pkg.recipient.full_name}
            </div>
            <div className="text-sm text-muted-foreground">
              {pkg.recipient.city}, {pkg.recipient.country}
            </div>
            <div className="text-sm text-muted-foreground">
              Tél. / WhatsApp : {pkg.recipient.phone}
            </div>
          </div>
        </div>

        <div className="rounded-md overflow-hidden border border-border mb-6">
          <div className="bg-primary text-white text-sm font-semibold px-4 py-2">
            Récapitulatif du colis et du paiement
          </div>
          <div className="divide-y divide-border text-sm">
            <Row label="Type de colis" value={pkg.package_type} />
            <Row label="Poids" value={`${pkg.weight_kg} kg`} alt />
            <Row
              label="Prix au kg"
              value={`${pkg.price_per_kg.toFixed(2)} €`}
            />
            <Row
              label="Montant total"
              value={`${pkg.total_amount.toFixed(2)} €`}
              alt
              bold
            />
            <Row
              label="Montant payé"
              value={`${pkg.amount_paid.toFixed(2)} €`}
            />
            <Row
              label="Mode de paiement"
              value={PAYMENT_METHOD_LABELS[pkg.payment_method]}
              alt
            />
            <Row
              label="Solde restant"
              value={balance > 0 ? `${balance.toFixed(2)} €` : "0,00 €"}
              highlight={balance > 0}
            />
          </div>
        </div>

        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ReceiptQrCode value={pkg.tracking_number} />
            <div>
              <div className="text-sm font-semibold text-foreground">
                Scannez pour suivre le colis
              </div>
              <div className="text-xs text-muted-foreground">
                Numéro : {pkg.tracking_number}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-6">
              {pkg.origin_agency.city}, le{" "}
              {new Date().toLocaleDateString("fr-FR")}
            </div>
            <div className="border-t border-foreground/40 pt-1 text-xs text-muted-foreground w-40">
              Signature et cachet de l&apos;agent
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
          Ce reçu fait foi de dépôt. Conservez-le jusqu&apos;à la livraison.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  alt,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  alt?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between px-4 py-2 ${alt ? "bg-muted/50" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${bold ? "font-semibold text-foreground" : "text-foreground"} ${
          highlight ? "text-accent font-semibold" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
