"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

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
import { PACKAGE_STATUS_LABELS, type PackageStatus } from "@/lib/types";

interface ChangeStatusDialogProps {
  packageId: string;
  trackingNumber: string;
  currentStatus: PackageStatus;
  agentId: string;
}

export function ChangeStatusDialog({
  packageId,
  trackingNumber,
  currentStatus,
  agentId,
}: ChangeStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<PackageStatus>(currentStatus);
  const [location, setLocation] = useState("");
  const [comment, setComment] = useState("");
  const [pickedUpByName, setPickedUpByName] = useState("");
  const [pickedUpByIdDocument, setPickedUpByIdDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);

    if (
      newStatus === "picked_up" &&
      (!pickedUpByName || !pickedUpByIdDocument)
    ) {
      setError("Le nom et la pièce d'identité de la personne sont requis.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: historyError } = await supabase
      .from("status_history")
      .insert({
        package_id: packageId,
        status: newStatus,
        location: location || null,
        comment: comment || null,
        picked_up_by_name: newStatus === "picked_up" ? pickedUpByName : null,
        picked_up_by_id_document:
          newStatus === "picked_up" ? pickedUpByIdDocument : null,
        agent_id: agentId,
      });

    if (historyError) {
      setLoading(false);
      setError("Impossible d'enregistrer le changement. Réessayez.");
      return;
    }

    const { error: updateError } = await supabase
      .from("packages")
      .update({ status: newStatus })
      .eq("id", packageId);

    setLoading(false);

    if (updateError) {
      setError(
        "Le statut a été enregistré mais la mise à jour du colis a échoué.",
      );
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <RefreshCw className="h-4 w-4" /> Changer le statut
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut du colis</DialogTitle>
          <DialogDescription>{trackingNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Statut actuel</Label>
            <div className="text-sm font-medium text-muted-foreground">
              {PACKAGE_STATUS_LABELS[currentStatus]}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStatus">Nouveau statut</Label>
            <NativeSelect
              id="newStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as PackageStatus)}
            >
              {Object.entries(PACKAGE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>

          {newStatus === "arrived" && (
            <div className="space-y-2">
              <Label htmlFor="location">Lieu / Agence de réception</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Entrepôt central - Gombe"
              />
            </div>
          )}

          {newStatus === "picked_up" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="pickedUpByName">
                  Nom de la personne ayant retiré
                </Label>
                <Input
                  id="pickedUpByName"
                  value={pickedUpByName}
                  onChange={(e) => setPickedUpByName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickedUpByIdDocument">
                  Pièce d&apos;identité présentée
                </Label>
                <Input
                  id="pickedUpByIdDocument"
                  value={pickedUpByIdDocument}
                  onChange={(e) => setPickedUpByIdDocument(e.target.value)}
                  placeholder="Ex: Passeport N° FR8923412"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire / Note (optionnel)</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Colis retardé à la douane"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">
            Le client sera notifié de ce changement par WhatsApp dès que cette
            fonctionnalité sera activée.
          </p>
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
            {loading ? "Enregistrement..." : "Confirmer le changement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
