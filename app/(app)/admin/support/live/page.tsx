import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import LiveSupportClient from "./LiveSupportClient";

export default async function LiveSupportPage() {
  await getRequiredAdmin();
  return <LiveSupportClient />;
}
