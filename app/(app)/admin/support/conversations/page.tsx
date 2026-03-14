import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { ConversationsClient } from "./ConversationsClient";

export default async function ConversationsPage() {
  await getRequiredAdmin();
  return <ConversationsClient />;
}
