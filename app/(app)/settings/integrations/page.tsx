import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { IntegrationsClient } from "@/app/(app)/admin/integrations/IntegrationsClient";

export default async function SettingsIntegrationsPage() {
  const user = await getRequiredUser();
  return (
    <div className="px-6 py-10">
      <IntegrationsClient tenantId={user.id} />
    </div>
  );
}
