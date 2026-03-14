import { notFound } from "next/navigation";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { getIntegration } from "../_components/integrations";
import { GmailIntegration } from "../_components/gmail/GmailIntegration";
import { OutlookIntegration } from "../_components/outlook/OutlookIntegration";
import { GraphIntegration } from "../_components/graph/GraphIntegration";
import { Microsoft365Integration } from "../_components/microsoft365/Microsoft365Integration";
import { GoogleCalendarIntegration } from "../_components/google-calendar/GoogleCalendarIntegration";
import { ZoomIntegration } from "../_components/zoom/ZoomIntegration";
import { TelegramIntegration } from "../_components/telegram/TelegramIntegration";
import { ZapierIntegration } from "../_components/zapier/ZapierIntegration";
import { OutboundWebhooksIntegration } from "../_components/outbound-webhooks/OutboundWebhooksIntegration";
import { KrispIntegration } from "../_components/krisp/KrispIntegration";

const COMPONENTS: Record<string, React.ComponentType<{ tenantId: string }>> = {
  gmail: GmailIntegration,
  outlook: OutlookIntegration,
  graph: GraphIntegration,
  microsoft365: Microsoft365Integration,
  "google-calendar": GoogleCalendarIntegration,
  zoom: ZoomIntegration,
  telegram: TelegramIntegration,
  zapier: ZapierIntegration,
  "outbound-webhooks": OutboundWebhooksIntegration,
  krisp: KrispIntegration,
};

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) notFound();

  const user = await getRequiredUser();
  const Component = COMPONENTS[slug];
  if (!Component) notFound();

  return (
    <div className="px-6 py-10">
      <Component tenantId={user.id} />
    </div>
  );
}
