// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { 
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
  },
  trustedOrigins: ["http://localhost:3000"],
  cookies: { 
    secure: false,
    sameSite: "lax",
  },
  plugins: [nextCookies()],
});
export type Session = typeof auth.$Infer.Session;
