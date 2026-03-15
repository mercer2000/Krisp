import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { aiLogs } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { decrypt, isEncrypted } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const admin = await getRequiredAdmin();

  const url = request.nextUrl;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const triggerType = url.searchParams.get("triggerType") || null;
  const offset = (page - 1) * limit;

  const conditions = [eq(aiLogs.userId, admin.id)];
  if (triggerType) {
    conditions.push(eq(aiLogs.triggerType, triggerType));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(aiLogs)
      .where(where)
      .orderBy(desc(aiLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(aiLogs)
      .where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  // Decrypt prompts and responses
  const decryptedRows = rows.map((row) => ({
    ...row,
    prompt: isEncrypted(row.prompt) ? decrypt(row.prompt) : row.prompt,
    response: isEncrypted(row.response) ? decrypt(row.response) : row.response,
  }));

  return NextResponse.json({
    logs: decryptedRows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
