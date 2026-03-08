import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { ExtensionsClient } from "@/app/(app)/admin/extensions/ExtensionsClient";

export default async function SettingsExtensionsPage() {
  const user = await getRequiredUser();
  return (
    <div className="px-6 py-10">
      <ExtensionsClient userId={user.id} />
    </div>
  );
}
