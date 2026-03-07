import { NextResponse } from "next/server";

export async function GET() {
  const jwk = JSON.parse(
    Buffer.from(process.env.AUTH_PUBLIC_JWK!, "base64").toString("utf-8")
  );

  return NextResponse.json(
    { keys: [jwk] },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
