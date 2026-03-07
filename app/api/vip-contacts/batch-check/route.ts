import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vipContacts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { batchCheckVipSchema } from "@/lib/validators/schemas";

// POST /api/vip-contacts/batch-check — check which senders are VIP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = batchCheckVipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch all VIP contacts for this user
    const rows = await db
      .select({ email: vipContacts.email, domain: vipContacts.domain })
      .from(vipContacts)
      .where(eq(vipContacts.tenantId, userId));

    // Build lookup sets for fast matching
    const vipEmails = new Set(rows.map((r) => r.email.toLowerCase()));
    const vipDomains = new Set(
      rows.filter((r) => r.domain).map((r) => r.domain!.toLowerCase())
    );

    // Check each sender against VIP emails and domains
    const vipMap: Record<string, boolean> = {};
    for (const sender of parsed.data.senders) {
      const senderLower = sender.toLowerCase();
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = senderLower.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1] : senderLower;
      const senderDomain = senderEmail.includes("@")
        ? senderEmail.split("@")[1]
        : null;

      vipMap[sender] =
        vipEmails.has(senderEmail) ||
        (senderDomain !== null && vipDomains.has(senderDomain));
    }

    return NextResponse.json({ vipMap });
  } catch (error) {
    console.error("Error batch-checking VIP contacts:", error);
    return NextResponse.json(
      { error: "Failed to check VIP contacts" },
      { status: 500 }
    );
  }
}
