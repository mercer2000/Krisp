import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs, emailEvents, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [adminUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [email] = await db
    .select({
      id: emailLogs.id,
      userId: emailLogs.userId,
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      type: emailLogs.type,
      subject: emailLogs.subject,
      htmlBody: emailLogs.htmlBody,
      resendId: emailLogs.resendId,
      status: emailLogs.status,
      originalEmailLogId: emailLogs.originalEmailLogId,
      createdAt: emailLogs.createdAt,
      updatedAt: emailLogs.updatedAt,
      userName: users.displayName,
    })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(eq(emailLogs.id, id))
    .limit(1);

  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.emailLogId, id))
    .orderBy(asc(emailEvents.occurredAt));

  return NextResponse.json({ email, events });
}
