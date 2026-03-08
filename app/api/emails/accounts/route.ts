import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getOutlookTokensForTenant } from "@/lib/outlook/oauth";
import { getActiveWatches } from "@/lib/gmail/watch";
import { getZoomTokensForTenant } from "@/lib/zoom/oauth";

export interface EmailAccountInfo {
  id: string;
  email: string;
  provider: "outlook" | "gmail" | "zoom";
}

/**
 * GET /api/emails/accounts
 * Returns a unified list of all connected accounts (Outlook + Gmail + Zoom).
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [outlookTokens, gmailWatches, zoomTokens] = await Promise.all([
      getOutlookTokensForTenant(userId),
      getActiveWatches(userId),
      getZoomTokensForTenant(userId),
    ]);

    const accounts: EmailAccountInfo[] = [
      ...outlookTokens.map((t) => ({
        id: t.id,
        email: t.outlook_email,
        provider: "outlook" as const,
      })),
      ...gmailWatches.map((w) => ({
        id: w.id,
        email: w.emailAddress,
        provider: "gmail" as const,
      })),
      ...zoomTokens.map((z) => ({
        id: z.id,
        email: z.zoom_email,
        provider: "zoom" as const,
      })),
    ];

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching email accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
