import { db } from "@/lib/db";
import { supportChatSessions, supportChatMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Send a message as an agent in an active session.
 */
export async function sendAgentMessage(
  sessionId: string,
  agentId: string,
  content: string
): Promise<{
  id: string;
  role: string;
  content: string;
  agentId: string;
  createdAt: Date;
}> {
  // Validate session is agent_active and assigned to this agent
  const [session] = await db
    .select({
      status: supportChatSessions.status,
      assignedAgentId: supportChatSessions.assignedAgentId,
    })
    .from(supportChatSessions)
    .where(eq(supportChatSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "agent_active") {
    throw new Error("Session is not in agent_active state");
  }

  if (session.assignedAgentId !== agentId) {
    throw new Error("You are not assigned to this session");
  }

  // Insert agent message
  const [message] = await db
    .insert(supportChatMessages)
    .values({
      sessionId,
      role: "agent",
      content,
      agentId,
    })
    .returning({
      id: supportChatMessages.id,
      role: supportChatMessages.role,
      content: supportChatMessages.content,
      agentId: supportChatMessages.agentId,
      createdAt: supportChatMessages.createdAt,
    });

  // Update session timestamp
  await db
    .update(supportChatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(supportChatSessions.id, sessionId));

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    agentId: message.agentId!,
    createdAt: message.createdAt,
  };
}
