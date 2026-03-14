import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { KnowledgeBaseClient } from "./KnowledgeBaseClient";

export default async function KnowledgeBasePage() {
  await getRequiredAdmin();
  return <KnowledgeBaseClient />;
}
