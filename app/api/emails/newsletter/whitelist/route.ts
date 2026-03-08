import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getWhitelist,
  addToWhitelist,
} from "@/lib/email/newsletterDetection";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whitelist = await getWhitelist(userId);
    return NextResponse.json({ data: whitelist });
  } catch (error) {
    console.error("Error fetching whitelist:", error);
    return NextResponse.json(
      { error: "Failed to fetch whitelist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { senderEmail } = body;

    if (!senderEmail || typeof senderEmail !== "string" || senderEmail.length > 512) {
      return NextResponse.json(
        { error: "Valid senderEmail is required" },
        { status: 400 }
      );
    }

    const entry = await addToWhitelist(userId, senderEmail);
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    return NextResponse.json(
      { error: "Failed to add to whitelist" },
      { status: 500 }
    );
  }
}
