"use client";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient();
export const { signUp, signIn, signOut, useSession, sendVerificationEmail, verifyEmail } = authClient;
