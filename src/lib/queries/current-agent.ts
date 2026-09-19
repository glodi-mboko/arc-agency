import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Agent, Agency } from "@/lib/types";

/**
 * Wrapped in React's cache() so multiple components rendered during the
 * same request (layout + page + nested components) share a single
 * Supabase auth check + agent lookup instead of each re-querying.
 * auth.getUser() alone is a network round trip to Supabase's auth server,
 * so avoiding duplicate calls matters a lot for perceived speed.
 */
export const getCurrentAgent = cache(async (): Promise<Agent | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", user.id)
    .single();

  return (agent as Agent) ?? null;
});

export const getActiveAgency = cache(async (): Promise<Agency | null> => {
  const agencyId = await getActiveAgencyId();
  if (!agencyId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", agencyId)
    .single();
  return (data as Agency) ?? null;
});

export const getActiveAgencyId = cache(async (): Promise<string | null> => {
  const agent = await getCurrentAgent();
  if (!agent) return null;

  const cookieStore = await cookies();
  return cookieStore.get("active_agency_id")?.value ?? agent.default_agency_id;
});
