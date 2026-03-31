// src/app/access-denied/page.tsx

import { ShieldX } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
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
        <Link
          href="/tp/config/break-policies"
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/auth"
          className="rounded-md border border-border px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-muted"
        >
          Sign in with different account
        </Link>
      </div>
    </div>
  );
}
