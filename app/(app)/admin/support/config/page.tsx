import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { WidgetConfigClient } from "./WidgetConfigClient";

export default async function WidgetConfigPage() {
  await getRequiredAdmin();
  return <WidgetConfigClient />;
}
