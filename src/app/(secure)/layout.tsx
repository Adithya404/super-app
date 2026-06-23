"use client";

import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "@/components/layout/AppShell";

export default function SecureLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Middleware handles the actual redirect if unauthenticated,
  // but we wait for loading to finish before rendering the shell
  if (status === "loading" || !session) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // PingPal manages its own full-screen layout
  const hideSidebar = pathname.startsWith("/pp");

  return (
    <AppShell teams={session.user.teams ?? []} user={session.user} hideSidebar={hideSidebar}>
      {children}
    </AppShell>
  );
}
