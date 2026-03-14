import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { IntegrationsOverview } from "./_components/IntegrationsOverview";

export default async function SettingsIntegrationsPage() {
  const user = await getRequiredUser();
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Integrations
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Connect external services to ingest data automatically
      </p>
      <IntegrationsOverview />
    </div>
  );
}
