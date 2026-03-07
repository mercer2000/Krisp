import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validators/schemas";
import { importPKCS8, importJWK, SignJWT, jwtVerify } from "jose";

// Lazy-load keys from base64-encoded env vars
let _privateKey: CryptoKey | null = null;
let _publicKey: CryptoKey | null = null;

async function getPrivateKey(): Promise<CryptoKey> {
  if (!_privateKey) {
    const pem = Buffer.from(process.env.AUTH_PRIVATE_KEY!, "base64").toString(
      "utf-8"
    );
    _privateKey = await importPKCS8(pem, "RS256");
  }
  return _privateKey;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (!_publicKey) {
    const jwk = JSON.parse(
      Buffer.from(process.env.AUTH_PUBLIC_JWK!, "base64").toString("utf-8")
    );
    _publicKey = (await importJWK(jwk, "RS256")) as CryptoKey;
  }
  return _publicKey;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, parsed.data.username));

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, name: user.displayName, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.userId as string;
      return session;
    },
  },
  jwt: {
    async encode({ token }) {
      const privateKey = await getPrivateKey();
      const jwk = JSON.parse(
        Buffer.from(process.env.AUTH_PUBLIC_JWK!, "base64").toString("utf-8")
      );
      return new SignJWT({ ...token })
        .setProtectedHeader({ alg: "RS256", kid: jwk.kid })
        .setIssuedAt()
        .setExpirationTime("30d")
        .setSubject(String(token?.userId ?? token?.sub ?? ""))
        .sign(privateKey);
    },
    async decode({ token }) {
      if (!token) return null;
      try {
        const publicKey = await getPublicKey();
        const { payload } = await jwtVerify(token, publicKey, {
          algorithms: ["RS256"],
        });
        return payload as any;
      } catch {
        return null;
      }
    },
  },
});
