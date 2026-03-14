import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs, users } from "@/lib/db/schema";
import { eq, ilike, and, gte, or, sql, desc, count } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const range = url.searchParams.get("range") ?? "24h";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 50;

  // Time range filter
  const now = new Date();
  const rangeMs: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const since = new Date(now.getTime() - (rangeMs[range] ?? rangeMs["24h"]));

  // Build conditions
  const conditions = [gte(emailLogs.createdAt, since)];
  if (search) {
    conditions.push(
      or(
        ilike(emailLogs.recipientEmail, `%${search}%`),
        ilike(users.displayName, `%${search}%`)
      )!
    );
  }
  if (type) {
    // Type dropdown passes prefix values like "billing" — use LIKE for dotted types
    conditions.push(
      type.includes(".")
        ? eq(emailLogs.type, type)
        : ilike(emailLogs.type, `${type}%`)
    );
  }
  if (status) conditions.push(eq(emailLogs.status, status));

  const whereClause = and(...conditions);

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(whereClause);

  // Get paginated emails
  const emails = await db
    .select({
      id: emailLogs.id,
      userId: emailLogs.userId,
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      type: emailLogs.type,
      subject: emailLogs.subject,
      resendId: emailLogs.resendId,
      status: emailLogs.status,
      originalEmailLogId: emailLogs.originalEmailLogId,
      createdAt: emailLogs.createdAt,
      updatedAt: emailLogs.updatedAt,
      userName: users.displayName,
    })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(emailLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Metrics for the time range (unfiltered by search/type/status)
  const metricsCondition = gte(emailLogs.createdAt, since);
  const [metrics] = await db
    .select({
      total: count(),
      delivered: sql<number>`count(*) filter (where ${emailLogs.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${emailLogs.status} = 'bounced')`,
      opened: sql<number>`count(*) filter (where ${emailLogs.status} = 'opened')`,
      complained: sql<number>`count(*) filter (where ${emailLogs.status} = 'complained')`,
    })
    .from(emailLogs)
    .where(metricsCondition);

  return NextResponse.json({ emails, total, metrics });
}
