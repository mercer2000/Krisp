import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { EmailsClient } from "./EmailsClient";

export default async function AdminEmailsPage() {
  const admin = await getRequiredAdmin();
  return <EmailsClient adminId={admin.id} />;
}
