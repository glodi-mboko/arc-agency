"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PACKAGE_STATUS_LABELS, type Agency } from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 400;

export function PackagesFilterBar({ agencies }: { agencies: Agency[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("q", value);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleClearSearch() {
    setSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateParam("q", "");
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="N° de suivi..."
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="all">Statut : Tous</option>
        {Object.entries(PACKAGE_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            Statut : {label}
          </option>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("origin") ?? "all"}
        onChange={(e) => updateParam("origin", e.target.value)}
      >
        <option value="all">Origine : Toutes</option>
        {agencies.map((a) => (
          <option key={a.id} value={a.id}>
            Origine : {a.name}
          </option>
        ))}
      </NativeSelect>

      <NativeSelect
        className="w-auto"
        defaultValue={searchParams.get("destination") ?? "all"}
        onChange={(e) => updateParam("destination", e.target.value)}
      >
        <option value="all">Destination : Toutes</option>
        {agencies.map((a) => (
          <option key={a.id} value={a.id}>
            Destination : {a.name}
          </option>
        ))}
      </NativeSelect>

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

      {isPending && (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </span>
      )}
    </div>
  );
}
