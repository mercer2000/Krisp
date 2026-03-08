import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const user = await getRequiredUser();
  return <BillingClient userId={user.id} />;
}
