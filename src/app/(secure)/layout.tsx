import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { tpApp } from "@/components/layout/apps/tp";

const apps = [tpApp]; // add more apps here as you build them

export default async function SecureLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth");

  return (
    <AppShell apps={apps} user={session.user}>
      {children}
    </AppShell>
  );
}
