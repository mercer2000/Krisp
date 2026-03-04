import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/pages/workspaces - list user's workspaces
export async function GET() {
  const user = await getRequiredUser();
  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id));
  return NextResponse.json(rows);
}

// POST /api/pages/workspaces - create workspace
export async function POST(req: Request) {
  const user = await getRequiredUser();
  const { name } = await req.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const [workspace] = await db
    .insert(workspaces)
    .values({ name, ownerId: user.id })
    .returning();
  return NextResponse.json(workspace, { status: 201 });
}
