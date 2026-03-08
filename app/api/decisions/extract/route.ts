import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { extractDecisionsFromMeeting, extractDecisionsFromEmail } from "@/lib/actions/extractDecisions";
import { db } from "@/lib/db";
import { decisions, emails } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, emailId, force } = await request.json();

    if (!meetingId && !emailId) {
      return NextResponse.json(
        { error: "meetingId or emailId is required" },
        { status: 400 }
      );
    }

    // If force re-extract, delete existing decisions for this source
    if (force) {
      if (meetingId) {
        await db
          .delete(decisions)
          .where(
            and(
              eq(decisions.userId, userId),
              eq(decisions.meetingId, meetingId)
            )
          );
      }
      if (emailId) {
        await db
          .delete(decisions)
          .where(
            and(eq(decisions.userId, userId), eq(decisions.emailId, emailId))
          );
      }
    }

    if (meetingId) {
      if (typeof meetingId !== "number") {
        return NextResponse.json(
          { error: "meetingId must be a number" },
          { status: 400 }
        );
      }

      const result = await extractDecisionsFromMeeting(meetingId, userId);
      return NextResponse.json({
        message: `Extracted ${result.count} decisions from meeting`,
        decisions: result.decisions,
        count: result.count,
      });
    }

    if (emailId) {
      if (typeof emailId !== "number") {
        return NextResponse.json(
          { error: "emailId must be a number" },
          { status: 400 }
        );
      }

      // Fetch email data
      const [email] = await db
        .select()
        .from(emails)
        .where(and(eq(emails.id, emailId), eq(emails.tenantId, userId)));

      if (!email) {
        return NextResponse.json(
          { error: "Email not found" },
          { status: 404 }
        );
      }

      const result = await extractDecisionsFromEmail(
        emailId,
        email.subject || "",
        email.bodyPlainText || "",
        email.sender,
        (email.recipients as string[]) || [],
        userId
      );

      return NextResponse.json({
        message: `Extracted ${result.count} decisions from email`,
        decisions: result.decisions,
        count: result.count,
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error extracting decisions:", error);
    return NextResponse.json(
      { error: "Failed to extract decisions" },
      { status: 500 }
    );
  }
}
