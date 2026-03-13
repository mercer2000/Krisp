import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { generateAssessment } from "@/lib/weekly-plan/assess";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const assessment = await generateAssessment(planId, user.id);

    return NextResponse.json(assessment);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
