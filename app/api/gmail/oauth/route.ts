import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getActiveWatch,
  deactivateWatch,
  stopGmailWatch,
  getValidAccessToken,
} from "@/lib/gmail/watch";
import { randomUUID } from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function buildGmailAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly email",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action");

    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/gmail/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildGmailAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    // Return connection status
    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = watch.expiration
      ? new Date(watch.expiration).getTime() < Date.now()
      : false;

    return NextResponse.json({
      connected: true,
      emailAddress: watch.emailAddress,
      historyId: watch.historyId,
      expiration: watch.expiration,
      topicName: watch.topicName,
      isExpired,
      createdAt: watch.createdAt,
      updatedAt: watch.updatedAt,
    });
  } catch (error) {
    console.error("Error in Gmail OAuth route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json(
        { error: "No active Gmail connection found" },
        { status: 404 }
      );
    }

    // Stop watch on Google's side
    try {
      const accessToken = await getValidAccessToken(watch);
      await stopGmailWatch(accessToken);
    } catch (err) {
      console.warn("[Gmail OAuth] Failed to stop watch on Google side:", err);
    }

    await deactivateWatch(watch.id);

    return NextResponse.json({ message: "Gmail disconnected" });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Gmail" },
      { status: 500 }
    );
  }
}
