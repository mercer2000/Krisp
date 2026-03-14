import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import CannedResponsesClient from "./CannedResponsesClient";

export default async function CannedResponsesPage() {
  await getRequiredAdmin();
  return <CannedResponsesClient />;
}
