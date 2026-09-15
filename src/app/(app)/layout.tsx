import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getCurrentAgent,
  getActiveAgencyId,
} from "@/lib/queries/current-agent";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AgentRole } from "@/lib/types";

const ROLE_LABELS: Record<AgentRole, string> = {
  agent: "Agent Transit",
  manager: "Responsable d'agence",
  admin: "Administrateur",
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/login");

  const activeAgencyId = await getActiveAgencyId();

  const supabase = await createClient();
  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", activeAgencyId!)
    .single();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar
        agencyLabel={agency ? `${agency.city}, ${agency.country}` : ""}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          agentName={agent.full_name}
          agentRole={ROLE_LABELS[agent.role as AgentRole] ?? agent.role}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
