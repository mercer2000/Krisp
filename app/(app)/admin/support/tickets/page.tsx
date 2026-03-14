import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import TicketsClient from "./TicketsClient";

export default async function TicketsPage() {
  await getRequiredAdmin();
  return <TicketsClient />;
}
