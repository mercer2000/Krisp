import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { vipContacts } from "@/lib/db/schema";
import { eq, and, ilike, desc } from "drizzle-orm";
import { createVipContactSchema } from "@/lib/validators/schemas";

// GET /api/vip-contacts — list all VIP contacts for the user
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q");

    let query = db
      .select()
      .from(vipContacts)
      .where(eq(vipContacts.tenantId, userId))
      .orderBy(desc(vipContacts.createdAt));

    if (q) {
      query = db
        .select()
        .from(vipContacts)
        .where(
          and(
            eq(vipContacts.tenantId, userId),
            ilike(vipContacts.email, `%${q}%`)
          )
        )
        .orderBy(desc(vipContacts.createdAt));
    }

    const rows = await query;

    return NextResponse.json({
      data: rows.map((r) => ({
        id: r.id,
        email: r.email,
        domain: r.domain,
        display_name: r.displayName,
        notify_on_new: r.notifyOnNew,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error listing VIP contacts:", error);
    return NextResponse.json(
      { error: "Failed to list VIP contacts" },
      { status: 500 }
    );
  }
}

// POST /api/vip-contacts — add a new VIP contact
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createVipContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, displayName, notifyOnNew } = parsed.data;

    // Extract domain from email address
    const domain = email.includes("@") ? email.split("@")[1].toLowerCase() : null;

    const [row] = await db
      .insert(vipContacts)
      .values({
        tenantId: userId,
        email: email.toLowerCase(),
        domain,
        displayName: displayName ?? null,
        notifyOnNew: notifyOnNew ?? false,
      })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "Contact already exists as VIP" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      data: {
        id: row.id,
        email: row.email,
        domain: row.domain,
        display_name: row.displayName,
        notify_on_new: row.notifyOnNew,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating VIP contact:", error);
    return NextResponse.json(
      { error: "Failed to create VIP contact" },
      { status: 500 }
    );
  }
}
