import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { PromptsClient } from "./PromptsClient";

export default async function PromptsPage() {
  const user = await getRequiredUser();
  return <PromptsClient userId={user.id} />;
}
