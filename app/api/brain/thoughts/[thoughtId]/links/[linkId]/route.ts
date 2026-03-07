import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { thoughtLinks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string; linkId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkId } = await params;

  const [deleted] = await db
    .delete(thoughtLinks)
    .where(
      and(
        eq(thoughtLinks.id, linkId),
        eq(thoughtLinks.userId, session.user.id)
      )
    )
    .returning({ id: thoughtLinks.id });

  if (!deleted) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
