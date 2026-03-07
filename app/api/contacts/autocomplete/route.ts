import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchContactsForAutocomplete } from "@/lib/contacts/contacts";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q") ?? "";
    if (q.length < 1) {
      return NextResponse.json({ data: [] });
    }

    const suggestions = await searchContactsForAutocomplete(userId, q, 10);
    return NextResponse.json({ data: suggestions });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
