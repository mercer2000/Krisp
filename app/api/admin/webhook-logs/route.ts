import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, webhookLogs, graphSubscriptions } from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const [adminUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const source = params.get("source");
  const status = params.get("status");
  const hours = Math.min(parseInt(params.get("hours") || "24", 10) || 24, 168);
  const limit = Math.min(parseInt(params.get("limit") || "200", 10) || 200, 500);

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Build conditions
  const conditions = [gte(webhookLogs.createdAt, since)];
  if (source) conditions.push(eq(webhookLogs.source, source));
  if (status) conditions.push(eq(webhookLogs.status, status));

  // Fetch logs
  const logs = await db
    .select({
      id: webhookLogs.id,
      source: webhookLogs.source,
      tenantId: webhookLogs.tenantId,
      status: webhookLogs.status,
      method: webhookLogs.method,
      durationMs: webhookLogs.durationMs,
      messageCount: webhookLogs.messageCount,
      errorMessage: webhookLogs.errorMessage,
      metadata: webhookLogs.metadata,
      createdAt: webhookLogs.createdAt,
    })
    .from(webhookLogs)
    .where(and(...conditions))
    .orderBy(desc(webhookLogs.createdAt))
    .limit(limit);

  // Fetch active graph subscriptions
  const activeGraphSubs = await db
    .select({
      id: graphSubscriptions.id,
      tenantId: graphSubscriptions.tenantId,
      subscriptionId: graphSubscriptions.subscriptionId,
      resource: graphSubscriptions.resource,
      expirationDateTime: graphSubscriptions.expirationDateTime,
      active: graphSubscriptions.active,
    })
    .from(graphSubscriptions)
    .where(eq(graphSubscriptions.active, true));

  // Compute metrics from the fetched logs
  const total = logs.length;
  const bySource: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalDuration = 0;
  let durationCount = 0;
  let totalMessages = 0;

  for (const log of logs) {
    bySource[log.source] = (bySource[log.source] || 0) + 1;
    byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    if (log.durationMs != null) {
      totalDuration += log.durationMs;
      durationCount++;
    }
    if (log.messageCount != null) {
      totalMessages += log.messageCount;
    }
  }

  return NextResponse.json({
    logs,
    graphSubscriptions: activeGraphSubs,
    metrics: {
      total,
      bySource,
      byStatus,
      avgDurationMs: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      totalMessagesProcessed: totalMessages,
    },
  });
}
