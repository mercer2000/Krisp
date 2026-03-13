import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { saveReflection } from "@/lib/weekly-plan/assess";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const body = await request.json();
    const { reflection } = body;

    if (!reflection || typeof reflection !== "string") {
      return NextResponse.json(
        { error: "Missing required field: reflection" },
        { status: 400 },
      );
    }

    await saveReflection(planId, user.id, reflection);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
