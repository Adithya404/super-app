import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/layout/AppShell";
import { apps } from "@/components/layout/apps/registry";

export default async function SecureLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth");
  // console.log("session.user in layout:", session.user);

  return (
    <AppShell apps={apps} user={session.user}>
      {children}
    </AppShell>
  );
}
