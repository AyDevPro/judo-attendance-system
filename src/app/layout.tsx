import "./../styles/globals.css";
import type { ReactNode } from "react";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/components/ToastProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";

export const metadata = { title: "JudoPresence", description: "Système de Gestion des Présences pour club de judo" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <ToastProvider>
          <ConfirmProvider>
            <Navigation />
            <main className="w-full mx-auto p-4 sm:p-6">{children}</main>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
