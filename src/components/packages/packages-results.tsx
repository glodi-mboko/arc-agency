import Link from "next/link";
import { Eye, Pencil, Printer } from "lucide-react";

import {
  getPackagesList,
  type PackageListFilters,
} from "@/lib/queries/packages";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { DirectionStatCard } from "@/components/packages/direction-stat-card";
import { PaginationControls } from "@/components/packages/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 8;

interface PackagesResultsProps {
  agencyId: string;
  filters: PackageListFilters;
  page: number;
}

export async function PackagesResults({
  agencyId,
  filters,
  page,
}: PackagesResultsProps) {
  const result = await getPackagesList(agencyId, filters);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <DirectionStatCard
          title="Tous les colis"
          value={result.totalAllTime}
          icon="package"
          direction="all"
        />
        <DirectionStatCard
          title="Envois"
          value={result.outboundCount}
          icon="outbound"
          direction="outbound"
          highlight
        />
        <DirectionStatCard
          title="Retraits"
          value={result.inboundCount}
          icon="inbound"
          direction="inbound"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">N° de suivi</th>
                  <th className="px-4 py-3 font-medium">Origine</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Expéditeur</th>
                  <th className="px-4 py-3 font-medium">Destinataire</th>
                  <th className="px-4 py-3 font-medium">Ville destination</th>
                  <th className="px-4 py-3 font-medium">Poids</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      Aucun colis ne correspond à ces critères.
                    </td>
                  </tr>
                ) : (
                  result.rows.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {p.tracking_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.origin_agency_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.destination_agency_name}
                      </td>
                      <td className="px-4 py-3">{p.sender_name}</td>
                      <td className="px-4 py-3">{p.recipient_name}</td>
                      <td className="px-4 py-3">{p.destination_city}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.weight_kg} kg
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/packages/${p.id}`}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                            title="Voir le détail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled
                            title="Bientôt disponible"
                            className="p-1.5 rounded text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled
                            title="Bientôt disponible"
                            className="p-1.5 rounded text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-sm text-muted-foreground">
            <span>
              Affichage de{" "}
              {result.rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} à{" "}
              {(page - 1) * PAGE_SIZE + result.rows.length} sur {result.total}{" "}
              colis
            </span>
            <PaginationControls page={page} totalPages={totalPages} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
