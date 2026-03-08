import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getDraftsForEmails } from "@/lib/smartLabels/draftGeneration";

/**
 * POST /api/smart-labels/drafts
 * Batch-fetch pending drafts for a list of email IDs.
 * Body: { emailType: string, emailIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { emailType, emailIds } = body;

    if (!emailType || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: "emailType and emailIds[] are required" },
        { status: 400 }
      );
    }

    if (emailIds.length > 200) {
      return NextResponse.json(
        { error: "Maximum 200 email IDs per request" },
        { status: 400 }
      );
    }

    const drafts = await getDraftsForEmails(userId, emailIds, emailType);
    return NextResponse.json({ data: drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}
