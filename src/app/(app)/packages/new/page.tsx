import {
  getCurrentAgent,
  getActiveAgencyId,
} from "@/lib/queries/current-agent";
import { getAllAgencies } from "@/lib/queries/agencies";
import { getAllPackageTypes } from "@/lib/queries/package-types";
import { NewPackageForm } from "@/components/packages/new-package-form";

export default async function NewPackagePage() {
  const [agent, activeAgencyId, agencies, packageTypes] = await Promise.all([
    getCurrentAgent(),
    getActiveAgencyId(),
    getAllAgencies(),
    getAllPackageTypes(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">
        Enregistrer un nouveau colis
      </h1>
      <NewPackageForm
        agencies={agencies}
        packageTypes={packageTypes}
        defaultOriginId={activeAgencyId!}
        agentId={agent!.id}
      />
    </div>
  );
}
