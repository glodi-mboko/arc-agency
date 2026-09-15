"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Loader2,
  Package as PackageIcon,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PackageDirection } from "@/lib/queries/packages";

const ICONS = {
  package: PackageIcon,
  outbound: ArrowUpRight,
  inbound: ArrowDownLeft,
} as const;

interface DirectionStatCardProps {
  title: string;
  value: number;
  icon: keyof typeof ICONS;
  direction: PackageDirection;
  highlight?: boolean;
}

export function DirectionStatCard({
  title,
  value,
  icon,
  direction,
  highlight,
}: DirectionStatCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const Icon = ICONS[icon];
  const active = (searchParams.get("direction") ?? "all") === direction;
  const filled = active && highlight;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    if (direction === "all") {
      params.delete("direction");
    } else {
      params.set("direction", direction);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <button type="button" onClick={handleClick} className="text-left w-full">
      <Card
        className={cn(
          "transition-colors cursor-pointer hover:border-accent",
          filled && "bg-primary text-white border-primary",
          active && !filled && "border-accent ring-1 ring-accent",
        )}
      >
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <div
              className={cn(
                "text-sm",
                filled ? "text-white/70" : "text-muted-foreground",
              )}
            >
              {title}
            </div>
            <div
              className={cn(
                "text-2xl font-bold mt-1",
                filled ? "text-white" : "text-primary",
              )}
            >
              {value}
            </div>
          </div>
          {isPending ? (
            <Loader2
              className={cn(
                "h-5 w-5 animate-spin",
                filled ? "text-white/70" : "text-muted-foreground",
              )}
            />
          ) : (
            <Icon
              className={cn(
                "h-5 w-5",
                filled ? "text-white/70" : "text-muted-foreground",
              )}
            />
          )}
        </CardContent>
      </Card>
    </button>
  );
}
