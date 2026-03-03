import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailDetail } from "@/lib/email/emails";
import { extractActionsFromEmail } from "@/lib/actions/extractEmailActions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const actions = await extractActionsFromEmail({
      sender: email.sender,
      recipients: email.recipients,
      subject: email.subject,
      bodyPlainText: email.body_plain_text,
      receivedAt: email.received_at,
    }, session.user?.email || undefined);

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error extracting email actions:", error);
    return NextResponse.json(
      { error: "Failed to extract actions from email" },
      { status: 500 }
    );
  }
}
