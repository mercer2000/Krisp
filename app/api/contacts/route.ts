import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listContacts, rebuildContactsFromEmails } from "@/lib/contacts/contacts";
import { contactListQuerySchema } from "@/lib/validators/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = contactListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, q, sort } = parsed.data;
    const { rows, total } = await listContacts(userId, { page, limit, q, sort });

    return NextResponse.json({ data: rows, total, page, limit });
  } catch (error) {
    console.error("Error listing contacts:", error);
    return NextResponse.json(
      { error: "Failed to list contacts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts - Rebuild contacts from existing emails
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await rebuildContactsFromEmails(userId);
    return NextResponse.json({ message: `Extracted ${count} contacts`, count });
  } catch (error) {
    console.error("Error rebuilding contacts:", error);
    return NextResponse.json(
      { error: "Failed to rebuild contacts" },
      { status: 500 }
    );
  }
}
