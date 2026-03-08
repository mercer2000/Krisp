import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { DeleteAccountDataClient } from "./DeleteAccountDataClient";

export default async function AccountPage() {
  await getRequiredUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Account
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Manage your account data and privacy settings.
      </p>

      <DeleteAccountDataClient />
    </div>
  );
}
