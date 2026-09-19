"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatMoney, type Currency } from "@/lib/currency";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/types";

interface RecordPaymentDialogProps {
  packageId: string;
  trackingNumber: string;
  agentId: string;
  currentAmountPaid: number;
  totalAmount: number;
  currency: Currency | null;
  originAgencyId: string;
  originAgencyName: string;
  destinationAgencyId: string;
  destinationAgencyName: string;
}

export function RecordPaymentDialog({
  packageId,
  trackingNumber,
  agentId,
  currentAmountPaid,
  totalAmount,
  currency,
  originAgencyId,
  originAgencyName,
  destinationAgencyId,
  destinationAgencyName,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [locationAgencyId, setLocationAgencyId] = useState(originAgencyId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = totalAmount - currentAmountPaid;

  async function handleConfirm() {
    setError(null);
    const numericAmount = Number(amount);

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setError("Entrez un montant valide.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: paymentError } = await supabase.from("payments").insert({
      package_id: packageId,
      amount: numericAmount,
      payment_method: paymentMethod,
      location_agency_id: locationAgencyId,
      agent_id: agentId,
    });

    if (paymentError) {
      setLoading(false);
      setError("Impossible d'enregistrer le paiement. Réessayez.");
      return;
    }

    const { error: updateError } = await supabase
      .from("packages")
      .update({ amount_paid: currentAmountPaid + numericAmount })
      .eq("id", packageId);

    setLoading(false);

    if (updateError) {
      setError(
        "Le paiement a été enregistré mais la mise à jour du colis a échoué.",
      );
      return;
    }

    setOpen(false);
    setAmount("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Wallet className="h-4 w-4" /> Enregistrer un paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un paiement</DialogTitle>
          <DialogDescription>{trackingNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Déjà payé</span>
              <span className="font-medium">
                {formatMoney(currentAmountPaid, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Solde restant</span>
              <span className="font-medium text-accent">
                {formatMoney(remaining, currency)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant reçu</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining > 0 ? remaining.toFixed(2) : "0.00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Mode de paiement</Label>
            <NativeSelect
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationAgencyId">Lieu du paiement</Label>
            <NativeSelect
              id="locationAgencyId"
              value={locationAgencyId}
              onChange={(e) => setLocationAgencyId(e.target.value)}
            >
              <option value={originAgencyId}>
                Origine — {originAgencyName}
              </option>
              <option value={destinationAgencyId}>
                Destination — {destinationAgencyName}
              </option>
            </NativeSelect>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? "Enregistrement..." : "Confirmer le paiement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
