import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportTickets } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(request: NextRequest) {
  try {
    await getRequiredAdmin();

    const params = request.nextUrl.searchParams;
    const parsed = querySchema.parse({
      status: params.get("status") || undefined,
      page: params.get("page") || 1,
    });

    const { status, page } = parsed;
    const limit = 20;
    const offset = (page - 1) * limit;

    // Build where condition
    const where = status ? eq(supportTickets.status, status) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(supportTickets)
      .where(where);

    // Fetch tickets
    const tickets = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        assignedAgentId: supportTickets.assignedAgentId,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      })
      .from(supportTickets)
      .where(where)
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ tickets, totalPages });
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
