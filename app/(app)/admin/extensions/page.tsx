import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { ExtensionsClient } from "./ExtensionsClient";

export default async function ExtensionsPage() {
  const user = await getRequiredUser();
  return <ExtensionsClient userId={user.id} />;
}
