import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validators/schemas";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createUserKey } from "@/lib/openrouter/keys";
import { encrypt } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, email, displayName, password } = parsed.data;

    // Check for existing user with same username or email
    const [existing] = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));

    if (existing) {
      if (existing.username === username) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        displayName,
        passwordHash,
      })
      .returning({ id: users.id, username: users.username });

    // Provision a per-user OpenRouter API key (non-blocking for registration)
    try {
      if (process.env.OPENROUTER_PROVISIONING_KEY) {
        const { key, hash } = await createUserKey(newUser.id, displayName);
        await db
          .update(users)
          .set({
            openrouterApiKey: encrypt(key),
            openrouterKeyHash: hash,
          })
          .where(eq(users.id, newUser.id));
      }
    } catch (keyError) {
      // Log but don't fail registration — user falls back to global key
      console.error("Failed to provision OpenRouter key:", keyError);
    }

    return NextResponse.json(
      { id: newUser.id, username: newUser.username },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
