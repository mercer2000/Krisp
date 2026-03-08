import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { SmartLabelsClient } from "@/app/(app)/admin/smart-labels/SmartLabelsClient";

export default async function SettingsSmartLabelsPage() {
  const user = await getRequiredUser();
  return (
    <div className="px-6 py-10">
      <SmartLabelsClient userId={user.id} />
    </div>
  );
}
