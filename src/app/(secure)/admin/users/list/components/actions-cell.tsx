"use client";

import { MoreHorizontal, Pencil, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Users } from "@/lib/common/ds/types/admin/Users";
import { AssignRolesDialog } from "./assign-roles-dialog";

export function ActionsCell({ user, onEdit }: { user: Users; onEdit: (user: Users) => void }) {
  const [showRolesDialog, setShowRolesDialog] = useState(false);

  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(user)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          {user.email && (
            <DropdownMenuItem onClick={() => setShowRolesDialog(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Assign Roles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {user.email && showRolesDialog && (
        <AssignRolesDialog user={user} open={showRolesDialog} onOpenChange={setShowRolesDialog} />
      )}
    </div>
  );
}
