import { createClient } from "@/lib/supabase/client";
import type { Agency } from "@/lib/types";

export interface AgentLoginInfo {
  id: string;
  email: string;
}

export interface AgentLookup {
  agent: AgentLoginInfo;
  defaultAgency: Agency;
}

/**
 * Looks up an agent by their username via the get_login_info() RPC
 * (a security-definer function) instead of selecting the agents table
 * directly — RLS blocks anonymous access to that table, and this call
 * happens before the person is signed in. Returns null if no match is
 * found (kept generic on purpose — the login form shows a single
 * "identifiants incorrects" message regardless of whether the username
 * or password is wrong).
 */
export async function getAgentByUsername(
  username: string,
): Promise<AgentLookup | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_login_info", {
    p_username: username,
  });

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  if (!row.email || !row.default_agency_id) return null;

  const { data: defaultAgency, error: agencyError } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", row.default_agency_id)
    .single();

  if (agencyError || !defaultAgency) return null;

  return {
    agent: { id: row.agent_id, email: row.email },
    defaultAgency,
  };
}

interface AuthorizedAgencyRow {
  agency_id: string;
  agency_name: string;
  agency_country: string;
  agency_city: string;
}

/**
 * Returns the list of agencies an agent is allowed to switch to,
 * always including their default agency first. Also goes through an
 * RPC for the same pre-login RLS reason as above.
 */
export async function getAuthorizedAgencies(
  agentId: string,
  defaultAgency: Agency,
): Promise<Agency[]> {
  const supabase = createClient();

  const { data: extraRows } = await supabase.rpc("get_authorized_agencies", {
    p_agent_id: agentId,
  });

  const rows: AuthorizedAgencyRow[] = extraRows ?? [];

  const extraAgencies: Agency[] = rows
    .filter((row) => row.agency_id !== defaultAgency.id)
    .map((row) => ({
      id: row.agency_id,
      name: row.agency_name,
      country: row.agency_country,
      city: row.agency_city,
      price_per_kg: null,
      currency: null,
      created_at: "",
    }));

  return [defaultAgency, ...extraAgencies];
}
