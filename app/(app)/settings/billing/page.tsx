import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { BillingClient } from "@/app/(app)/billing/BillingClient";

export default async function SettingsBillingPage() {
  const user = await getRequiredUser();
  return (
    <div className="px-6 py-10">
      <BillingClient userId={user.id} />
    </div>
  );
}
