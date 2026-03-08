import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { SubscriptionsClient } from "./SubscriptionsClient";

export default async function AdminSubscriptionsPage() {
  const admin = await getRequiredAdmin();
  return <SubscriptionsClient adminId={admin.id} />;
}
