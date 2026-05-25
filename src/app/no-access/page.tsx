"use client";

import { Lock } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Lock size={40} className="text-muted-foreground" />
      </div>

      <div className="space-y-2 text-center">
        <h1 className="font-semibold text-3xl">No Applications Available</h1>
        <p className="max-w-md text-muted-foreground">
          Your account does not have roles assigned that grant access to any applications in this
          portal. Please contact your administrator to request access.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => {
            signOut({ callbackUrl: "/auth" });
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
