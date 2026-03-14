import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { activatePlan } from "@/lib/weekly-plan/generate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const body = await request.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: "Missing required field: boardId" },
        { status: 400 },
      );
    }

    await activatePlan(planId, user.id, boardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("[Weekly Plan Activate] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
