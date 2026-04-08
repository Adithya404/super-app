"use client";
import { redirect, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
// import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { apps } from "@/components/layout/apps/registry";

export default function SecureLayout({ children }: { children: React.ReactNode }) {
  // const session = await auth();
  const { data: session } = useSession();
  const pathname = usePathname();
  if (!session) redirect("/auth");
  // PingPal manages its own full-screen layout
  const hideSidebar = pathname.startsWith("/pp");

  return (
    <AppShell apps={apps} user={session.user} hideSidebar={hideSidebar}>
      {children}
    </AppShell>
  );
}
