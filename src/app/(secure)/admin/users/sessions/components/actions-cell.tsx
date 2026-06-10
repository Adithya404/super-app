"use client";

import { LogOut, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from "@/components/ui/notifications";
import type { Sessions } from "@/lib/common/ds/types/admin/Sessions";

export function SessionActionsCell({
  session,
  onSignOut,
}: {
  session: Sessions;
  onSignOut: (sessionId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await onSignOut(session.id);
      showSuccess("User signed out successfully");
    } catch (err) {
      console.error("Failed to sign out user:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={loading}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
