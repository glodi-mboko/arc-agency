import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";

import { getPackageDetail } from "@/lib/queries/package-detail";
import { getCurrentAgent } from "@/lib/queries/current-agent";
import { StatusBadge } from "@/components/dashboard/status-badge";
// import { StatusHistoryTimeline } from "@/components/packages/status-history-timeline";
import { ChangeStatusDialog } from "@/components/packages/change-status-dialog";
import { RecordPaymentDialog } from "@/components/packages/record-payment-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";
import { ID_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/types";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pkg, agent] = await Promise.all([
    getPackageDetail(id),
    getCurrentAgent(),
  ]);

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
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-muted-foreground">N° de suivi</div>
            <div className="text-2xl font-bold text-primary">
              {pkg.tracking_number}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Enregistré le{" "}
              {new Date(pkg.created_at).toLocaleDateString("fr-FR")} à{" "}
              {pkg.origin_agency.city}
            </div>
          </div>
          <StatusBadge status={pkg.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Expéditeur ({pkg.origin_agency.country})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Nom complet" value={senderFullName} />
            <Row label="Adresse" value={senderAddress} />
            <Row label="WhatsApp" value={pkg.sender.whatsapp} />
            <Row
              label="Pièce d'identité"
              value={`${ID_TYPE_LABELS[pkg.sender.id_type]} (N° ${pkg.sender.id_number})`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Destinataire ({pkg.destination_agency.country})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Nom complet" value={pkg.recipient.full_name} />
            <Row label="Ville de livraison" value={pkg.recipient.city} />
            <Row label="Téléphone" value={pkg.recipient.phone} />
            <Row
              label="Mode de retrait"
              value={`À l'agence de ${pkg.destination_agency.name}`}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agent && (
                <ChangeStatusDialog
                  packageId={pkg.id}
                  trackingNumber={pkg.tracking_number}
                  currentStatus={pkg.status}
                  agentId={agent.id}
                />
              )}
              {agent && balance > 0 && (
                <RecordPaymentDialog
                  packageId={pkg.id}
                  trackingNumber={pkg.tracking_number}
                  agentId={agent.id}
                  currentAmountPaid={pkg.amount_paid}
                  totalAmount={pkg.total_amount}
                  currency={pkg.price_per_kg_currency}
                  originAgencyId={pkg.origin_agency_id}
                  originAgencyName={pkg.origin_agency.name}
                  destinationAgencyId={pkg.destination_agency_id}
                  destinationAgencyName={pkg.destination_agency.name}
                />
              )}
              <Link
                href={`/packages/${pkg.id}/receipt`}
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <FileText className="h-4 w-4" /> Générer le reçu PDF
              </Link>
            </CardContent>
          </Card>

          {/* Masqué temporairement — décommenter pour réactiver.
          <Card>
            <CardHeader>
              <CardTitle>Historique du statut</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusHistoryTimeline
                currentStatus={pkg.status}
                history={pkg.status_history}
              />
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pkg.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun paiement enregistré.
                </p>
              ) : (
                pkg.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {formatMoney(p.amount, pkg.price_per_kg_currency)} ·{" "}
                        {PAYMENT_METHOD_LABELS[p.payment_method]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.location_agency_name} ·{" "}
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spécifications &amp; Facturation</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-4 text-sm">
          <Field label="Type de colis" value={pkg.package_type} />
          {pkg.details && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Détail du colis</p>
              <p className="text-sm whitespace-pre-wrap">{pkg.details}</p>
            </div>
          )}
          <Field label="Poids total" value={`${pkg.weight_kg} kg`} />
          <Field
            label="Tarif / kg"
            value={formatMoney(pkg.price_per_kg, pkg.price_per_kg_currency)}
          />
          <Field
            label="Montant total"
            value={formatMoney(pkg.total_amount, pkg.price_per_kg_currency)}
            highlight
          />
          <Field
            label="Mode de paiement"
            value={PAYMENT_METHOD_LABELS[pkg.payment_method]}
          />
          <Field
            label="Montant payé"
            value={formatMoney(pkg.amount_paid, pkg.price_per_kg_currency)}
            positive
          />
          <Field
            label="Solde restant"
            value={
              balance > 0
                ? `${formatMoney(balance, pkg.price_per_kg_currency)} à régler`
                : "Payé intégralement"
            }
            warn={balance > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
  positive,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-muted rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "font-semibold mt-0.5",
          highlight && "text-accent",
          positive && "text-green-700",
          warn && "text-accent",
        )}
      >
        {value}
      </div>
    </div>
  );
}
