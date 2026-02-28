import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { IntegrationsClient } from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const user = await getRequiredUser();
  return <IntegrationsClient tenantId={user.id} />;
}
