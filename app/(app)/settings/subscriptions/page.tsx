import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { SubscriptionsClient } from "@/app/(app)/admin/subscriptions/SubscriptionsClient";

export default async function SettingsSubscriptionsPage() {
  const admin = await getRequiredAdmin();
  return (
    <div className="px-6 py-10">
      <SubscriptionsClient adminId={admin.id} />
    </div>
  );
}
