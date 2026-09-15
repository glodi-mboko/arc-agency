"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { NativeSelect } from "@/components/ui/native-select";
import type { Agency } from "@/lib/types";

export function PaymentsFilterBar({ agencies }: { agencies: Agency[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const trajetOptions: { value: string; label: string }[] = [];
  agencies.forEach((origin) => {
    agencies.forEach((destination) => {
      if (origin.id === destination.id) return;
      trajetOptions.push({
        value: `${origin.id}:${destination.id}`,
        label: `${origin.name} → ${destination.name}`,
      });
    });
  });

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("period") ?? "all"}
        onChange={(e) => updateParam("period", e.target.value)}
      >
        <option value="all">Période : Toutes</option>
        <option value="today">Période : Aujourd&apos;hui</option>
        <option value="week">Période : Cette semaine</option>
        <option value="month">Période : Ce mois</option>
      </NativeSelect>

      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("trajet") ?? "all"}
        onChange={(e) => updateParam("trajet", e.target.value)}
      >
        <option value="all">Trajet : Tous</option>
        {trajetOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Trajet : {opt.label}
          </option>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="all">Statut paiement : Tous</option>
        <option value="paid">Statut paiement : Payé</option>
        <option value="partial">Statut paiement : Partiel</option>
        <option value="unpaid">Statut paiement : Impayé</option>
      </NativeSelect>

      {isPending && (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </span>
      )}
    </div>
  );
}
