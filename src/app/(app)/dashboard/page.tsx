import { Package, Weight, Wallet, Clock } from "lucide-react";

import { getActiveAgencyId } from "@/lib/queries/current-agent";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const agencyId = await getActiveAgencyId();
  const stats = await getDashboardStats(agencyId!);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tableau de bord</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Colis ce mois"
          value={stats.totalPackages.toString()}
          change={stats.totalPackagesChange}
          icon={Package}
        />
        <StatCard
          title="Poids total transporté"
          value={`${stats.totalWeight.toLocaleString("fr-FR")} kg`}
          change={stats.totalWeightChange}
          icon={Weight}
        />
        <StatCard
          title="Revenus du mois"
          value={`${stats.revenue.toLocaleString("fr-FR")} €`}
          change={stats.revenueChange}
          icon={Wallet}
        />
        <StatCard
          title="Colis en attente"
          value={stats.pending.toString()}
          change={null}
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Derniers colis enregistrés</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentPackages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Aucun colis enregistré pour le moment.
              </p>
            ) : (
              <div className="space-y-1">
                {stats.recentPackages.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">
                        {p.tracking_number}
                      </div>
                      <div className="text-muted-foreground text-xs truncate">
                        {p.sender_name} → {p.recipient_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={p.status} />
                      <span className="text-muted-foreground text-xs">
                        {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colis enregistrés par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyChart data={stats.weeklyCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
