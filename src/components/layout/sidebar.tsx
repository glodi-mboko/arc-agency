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
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/packages/new", label: "Nouveau colis", icon: PackagePlus },
  { href: "/packages", label: "Colis", icon: Package },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/payments", label: "Paiements", icon: CreditCard },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
];

function Logo({ agencyLabel }: { agencyLabel: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center font-bold text-xs shrink-0">
        ARC
      </div>
      <div>
        <div className="font-bold text-sm leading-tight">ARC Service</div>
        <div className="text-[10px] text-white/50">{agencyLabel}</div>
      </div>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export function Sidebar({ agencyLabel }: { agencyLabel: string }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop: fixed sidebar, always visible */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-primary text-white h-screen sticky top-0 overflow-y-auto p-4 print:hidden">
        <div className="py-2 mb-4">
          <Logo agencyLabel={agencyLabel} />
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile / tablet: slide-in drawer, triggered from Topbar's hamburger button */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-primary text-white p-4 flex flex-col overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Logo agencyLabel={agencyLabel} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 text-white/70 hover:text-white shrink-0"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
