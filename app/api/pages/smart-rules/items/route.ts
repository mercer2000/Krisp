import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import sql from "@/lib/smartLabels/db";

// POST /api/pages/smart-rules/items — get which smart-rule pages each email has been routed to
// Body: { itemType: "email" | "gmail_email", itemIds: string[] }
// Returns: { data: Record<itemId, { pageId: string; pageName: string; pageColor: string }[]> }
export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();
    const { itemType, itemIds } = (await request.json()) as {
      itemType: string;
      itemIds: string[];
    };

    if (!itemType || !itemIds?.length) {
      return NextResponse.json({ data: {} });
    }

    // Cap at 200 items to prevent abuse
    const ids = itemIds.slice(0, 200);

    const rows = await sql`
      SELECT pe.source_id, p.id AS page_id, p.title AS page_name, p.color AS page_color
      FROM page_entries pe
      JOIN pages p ON pe.page_id = p.id
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.owner_id = ${user.id}
        AND pe.source_type = ${itemType}
        AND pe.source_id = ANY(${ids})
        AND p.smart_active = true
        AND p.smart_rule IS NOT NULL
        AND p.is_archived = false
    `;

    const map: Record<string, { pageId: string; pageName: string; pageColor: string }[]> = {};
    for (const row of rows as Array<{
      source_id: string;
      page_id: string;
      page_name: string;
      page_color: string | null;
    }>) {
      if (!map[row.source_id]) map[row.source_id] = [];
      map[row.source_id].push({
        pageId: row.page_id,
        pageName: row.page_name || "Untitled",
        pageColor: row.page_color || "#8B5CF6",
      });
    }

    return NextResponse.json({ data: map });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error fetching smart rule items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
