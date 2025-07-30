import "./../styles/globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";

export const metadata = { title: "Attendance App", description: "Next.js + Better Auth + Prisma" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
