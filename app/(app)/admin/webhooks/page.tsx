import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { WebhooksClient } from "./WebhooksClient";

export default async function AdminWebhooksPage() {
  await getRequiredAdmin();
  return <WebhooksClient />;
}
