import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { SmartLabelsClient } from "./SmartLabelsClient";

export default async function SmartLabelsPage() {
  const user = await getRequiredUser();
  return <SmartLabelsClient userId={user.id} />;
}
