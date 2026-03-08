import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { PromptsClient } from "@/app/(app)/admin/prompts/PromptsClient";

export default async function SettingsPromptsPage() {
  const user = await getRequiredUser();
  return (
    <div className="px-6 py-10">
      <PromptsClient userId={user.id} />
    </div>
  );
}
