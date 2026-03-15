import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { AiLogsClient } from "./AiLogsClient";

export default async function AiLogsPage() {
  const admin = await getRequiredAdmin();
  return <AiLogsClient adminId={admin.id} />;
}
