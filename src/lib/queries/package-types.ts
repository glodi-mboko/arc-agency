import { createClient } from "@/lib/supabase/server";

export interface PackageType {
  id: string;
  name: string;
}

export async function getAllPackageTypes(): Promise<PackageType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("package_types")
    .select("id, name")
    .order("name");
  return data ?? [];
}
