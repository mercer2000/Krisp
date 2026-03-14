import { db } from "@/lib/db";
import {
  supportChatSessions,
  supportChatMessages,
  supportTickets,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { isAnyAgentOnline, incrementActiveCount, decrementActiveCount } from "./agent-presence";

/**
 * Request a human agent — called when user clicks "Talk to a person".
 * If agents are online → pending_agent. If not → ticket_created.
 */
export async function requestAgent(
  sessionId: string
): Promise<{ status: "pending_agent" | "ticket_created"; ticketId?: string }> {
  const agentsOnline = await isAnyAgentOnline();

  if (agentsOnline) {
    // Set session to pending_agent
    await db
      .update(supportChatSessions)
      .set({
        status: "pending_agent",
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.id, sessionId));

    // Insert system message
    await db.insert(supportChatMessages).values({
      sessionId,
      role: "system",
      content:
        "You've been connected to the queue. An agent will be with you shortly.",
    });

    return { status: "pending_agent" };
  } else {
    // No agents online — create a ticket
    // Get first user message as subject
    const firstMessage = await db
      .select({ content: supportChatMessages.content })
      .from(supportChatMessages)
      .where(
        and(
          eq(supportChatMessages.sessionId, sessionId),
          eq(supportChatMessages.role, "user")
        )
      )
      .orderBy(asc(supportChatMessages.createdAt))
      .limit(1);

    const subject =
      firstMessage[0]?.content?.slice(0, 200) ?? "Support request";

    // Update session status
    await db
      .update(supportChatSessions)
      .set({
        status: "ticket_created",
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportChatSessions.id, sessionId));

    // Create ticket
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        sessionId,
        subject,
      })
      .returning({ id: supportTickets.id });

    // Insert system message
    await db.insert(supportChatMessages).values({
      sessionId,
      role: "system",
      content:
        "No agents are currently available. We've created a support ticket and will get back to you soon.",
    });

    return { status: "ticket_created", ticketId: ticket.id };
  }
}

/**
 * Claim a pending session — agent takes ownership.
 */
export async function claimSession(
  sessionId: string,
  agentId: string
): Promise<void> {
  // Verify session is pending_agent
  const [session] = await db
    .select({ status: supportChatSessions.status })
    .from(supportChatSessions)
    .where(eq(supportChatSessions.id, sessionId))
    .limit(1);

  if (!session || session.status !== "pending_agent") {
    throw new Error("Session is not pending an agent");
  }

  // Get agent name
  const [agent] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, agentId))
    .limit(1);

  const agentName = agent?.displayName ?? "an agent";

  // Update session
  await db
    .update(supportChatSessions)
    .set({
      status: "agent_active",
      assignedAgentId: agentId,
      updatedAt: new Date(),
    })
    .where(eq(supportChatSessions.id, sessionId));

  // Increment agent's active count
  await incrementActiveCount(agentId);

  // Insert system message
  await db.insert(supportChatMessages).values({
    sessionId,
    role: "system",
    content: `You're now chatting with ${agentName}.`,
  });
}

/**
 * Close a session — agent marks conversation as resolved.
 */
export async function closeSession(
  sessionId: string,
  agentId: string,
  notes?: string
): Promise<void> {
  // Update session
  await db
    .update(supportChatSessions)
    .set({
      status: "agent_closed",
      agentNotes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(supportChatSessions.id, sessionId));

  // Decrement agent's active count
  await decrementActiveCount(agentId);

  // Insert system message
  await db.insert(supportChatMessages).values({
    sessionId,
    role: "system",
    content:
      "This conversation has been closed. Thank you for chatting with us!",
  });
}
