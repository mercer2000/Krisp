import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { gmailEmails, emails } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [[gmail], [outlook]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(gmailEmails)
      .where(
        and(
          eq(gmailEmails.tenantId, userId),
          eq(gmailEmails.isRead, false),
          eq(gmailEmails.isDone, false),
        )
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(
        and(
          eq(emails.tenantId, userId),
          eq(emails.isRead, false),
          eq(emails.isDone, false),
        )
      ),
  ]);

  return NextResponse.json({ count: (gmail?.count ?? 0) + (outlook?.count ?? 0) });
}
