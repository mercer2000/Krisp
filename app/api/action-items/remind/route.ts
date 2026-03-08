import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { actionItems, users } from "@/lib/db/schema";
import { eq, and, lte, isNull, inArray } from "drizzle-orm";
import { getResend, getSenderEmail } from "@/lib/email/resend";

export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user email
    const [user] = await db
      .select({ email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Find open/in_progress items due today or overdue that haven't been reminded today
    const dueItems = await db
      .select()
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          inArray(actionItems.status, ["open", "in_progress"]),
          lte(actionItems.dueDate, today),
          isNull(actionItems.reminderSentAt)
        )
      );

    if (dueItems.length === 0) {
      return NextResponse.json({
        message: "No action items need reminders",
        sent: 0,
      });
    }

    const resend = getResend();
    const senderEmail = getSenderEmail();

    // Build email content
    const itemsList = dueItems
      .map((item) => {
        const overdue = item.dueDate && item.dueDate < today;
        const label = overdue ? "OVERDUE" : "DUE TODAY";
        return `- [${label}] ${item.title}${item.assignee ? ` (assigned to ${item.assignee})` : ""}${item.dueDate ? ` — due ${item.dueDate}` : ""}`;
      })
      .join("\n");

    await resend.emails.send({
      from: senderEmail,
      to: user.email,
      subject: `Action Items Reminder: ${dueItems.length} item${dueItems.length > 1 ? "s" : ""} need attention`,
      html: `
        <h2>Action Items Reminder</h2>
        <p>Hi ${user.displayName},</p>
        <p>You have <strong>${dueItems.length}</strong> action item${dueItems.length > 1 ? "s" : ""} that ${dueItems.length > 1 ? "need" : "needs"} your attention:</p>
        <ul>
          ${dueItems
            .map((item) => {
              const overdue = item.dueDate && item.dueDate < today;
              return `<li>
                <strong style="color: ${overdue ? "#dc2626" : "#f59e0b"}">[${overdue ? "OVERDUE" : "DUE TODAY"}]</strong>
                ${item.title}
                ${item.assignee ? `<br/><small>Assigned to: ${item.assignee}</small>` : ""}
                ${item.dueDate ? `<br/><small>Due: ${item.dueDate}</small>` : ""}
              </li>`;
            })
            .join("")}
        </ul>
        <p>Log in to review and update your action items.</p>
      `,
    });

    // Mark items as reminded
    const itemIds = dueItems.map((i) => i.id);
    await db
      .update(actionItems)
      .set({ reminderSentAt: new Date() })
      .where(inArray(actionItems.id, itemIds));

    return NextResponse.json({
      message: `Sent reminder for ${dueItems.length} action items`,
      sent: dueItems.length,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
