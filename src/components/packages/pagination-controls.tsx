"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
}

export function PaginationControls({
  page,
  totalPages,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goTo(targetPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(targetPage));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    0,
    5,
  );

  return (
    <div className="flex items-center gap-2">
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      <button
        type="button"
        onClick={() => goTo(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={`px-3 py-1.5 rounded-md border border-border ${
          page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"
        }`}
      >
        Précédent
      </button>
      {pagesToShow.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => goTo(n)}
          className={`px-3 py-1.5 rounded-md border ${
            n === page
              ? "bg-primary text-white border-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => goTo(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={`px-3 py-1.5 rounded-md border border-border ${
          page >= totalPages
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-muted"
        }`}
      >
        Suivant
      </button>
    </div>
  );
}
