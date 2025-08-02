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
    requireEmailVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "PENDING",
        required: false,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 heure
    sendVerificationEmail: async ({ user, url, token }, request) => {
      console.log(`🔗 Email de vérification pour ${user.email}:`);
      console.log(`📧 Lien de vérification: ${url}`);
      
      try {
        // Choix du service d'email : Gmail en priorité, sinon Resend
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
          const { sendEmailGmail, createVerificationEmailTemplate } = await import('./email-gmail');
          await sendEmailGmail({
            to: user.email,
            subject: "Vérifiez votre adresse email - Système Judo",
            html: createVerificationEmailTemplate(url, user.name)
          });
        } else {
          const { sendEmail, createVerificationEmailTemplate } = await import('./email');
          await sendEmail({
            to: user.email,
            subject: "Vérifiez votre adresse email - Système Judo",
            html: createVerificationEmailTemplate(url, user.name)
          });
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
        // En cas d'erreur, on continue le processus (l'utilisateur peut toujours utiliser le lien des logs)
      }
    }
  },
  trustedOrigins: ["http://localhost:3000"],
  cookies: { 
    secure: false,
    sameSite: "lax",
  },
  plugins: [nextCookies()],
});
export type Session = typeof auth.$Infer.Session;
