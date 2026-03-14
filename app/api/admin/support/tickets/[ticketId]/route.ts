import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import {
  supportTickets,
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await getRequiredAdmin();
    const { ticketId } = await params;

    // Get ticket
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get linked session
    const [session] = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.id, ticket.sessionId))
      .limit(1);

    // Get messages ordered by createdAt ASC
    const messages = await db
      .select()
      .from(supportChatMessages)
      .where(eq(supportChatMessages.sessionId, ticket.sessionId))
      .orderBy(asc(supportChatMessages.createdAt));

    return NextResponse.json({ ticket, session, messages });
  } catch (error) {
    console.error("Failed to fetch ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

const patchSchema = z.object({
  status: z
    .enum(["open", "in_progress", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedAgentId: z.string().uuid().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    await getRequiredAdmin();
    const { ticketId } = await params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.status !== undefined) updates.status = parsed.status;
    if (parsed.priority !== undefined) updates.priority = parsed.priority;
    if (parsed.assignedAgentId !== undefined)
      updates.assignedAgentId = parsed.assignedAgentId;

    if (parsed.status === "resolved") {
      updates.resolvedAt = new Date();
    }

    const [ticket] = await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, ticketId))
      .returning();

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
