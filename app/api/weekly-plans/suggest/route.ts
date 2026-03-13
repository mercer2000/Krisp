import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import {
  generatePlanSuggestions,
  getUpcomingWeekRange,
} from "@/lib/weekly-plan/generate";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const body = await request.json().catch(() => ({}));
    const { weekStart, weekEnd } = body;

    let week;
    if (weekStart && weekEnd) {
      week = {
        start: new Date(weekStart),
        end: new Date(weekEnd),
      };
    } else {
      week = getUpcomingWeekRange();
    }

    const suggestions = await generatePlanSuggestions(user.id, week);

    return NextResponse.json(suggestions);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
