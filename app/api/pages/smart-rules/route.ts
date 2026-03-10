import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import sql from "@/lib/smartLabels/db";

// GET /api/pages/smart-rules — list pages with active smart rules for the user
export async function GET() {
  try {
    const user = await getRequiredUser();

    const rows = await sql`
      SELECT p.id, p.title, p.color, p.smart_rule
      FROM pages p
      JOIN workspaces w ON p.workspace_id = w.id
      WHERE w.owner_id = ${user.id}
        AND p.smart_active = true
        AND p.smart_rule IS NOT NULL
        AND p.is_archived = false
      ORDER BY p.title ASC
    `;

    const data = (rows as Array<{
      id: string;
      title: string;
      color: string | null;
      smart_rule: string;
    }>).map((r) => ({
      id: r.id,
      name: r.title || "Untitled",
      color: r.color || "#8B5CF6",
    }));

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error listing smart rule pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
