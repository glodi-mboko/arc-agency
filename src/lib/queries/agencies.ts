import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Agency } from "@/lib/types";

export const getAllAgencies = cache(async (): Promise<Agency[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("agencies").select("*").order("name");
  return data ?? [];
});
