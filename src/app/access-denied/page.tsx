"use client";

import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldX size={40} className="text-destructive" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-3xl">Access Denied</h1>
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => {
            router.push("/tp/config/break-policies");
          }}
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => {
            signOut({ callbackUrl: "/auth" });
          }}
        >
          Sign in with different account
        </Button>
      </div>
    </div>
  );
}
