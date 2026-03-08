import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserApiKey } from "@/lib/ai/client";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = await getUserApiKey(userId);
    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key configured" },
        { status: 404 }
      );
    }

    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch usage from OpenRouter" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI usage" },
      { status: 500 }
    );
  }
}
