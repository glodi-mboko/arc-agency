"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Users,
  CreditCard,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/packages/new", label: "Nouveau colis", icon: PackagePlus },
  { href: "/packages", label: "Colis", icon: Package },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/payments", label: "Paiements", icon: CreditCard },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
];

export function Sidebar({ agencyLabel }: { agencyLabel: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-primary text-white h-screen sticky top-0 overflow-y-auto p-4 print:hidden">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center font-bold text-xs">
          ARC
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">ARC Service</div>
          <div className="text-[10px] text-white/50">{agencyLabel}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
