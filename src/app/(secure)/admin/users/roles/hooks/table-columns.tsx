"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateOnly } from "@/lib/common/date";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";

function RolesActionsCell({ role, onEdit }: { role: Roles; onEdit: (role: Roles) => void }) {
  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(role)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getColumns(handlers: { onEdit: (role: Roles) => void }): ColumnDef<Roles>[] {
  return [
    { accessorKey: "role", header: "Role" },
    { accessorKey: "roleCode", header: "Role Code" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "app", header: "App" },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => formatDateOnly(row.getValue("startDate") as string | Date | null),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => formatDateOnly(row.getValue("endDate") as string | Date | null),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => formatDateOnly(row.getValue("createdAt") as string | Date | null),
    },
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => <RolesActionsCell role={row.original} onEdit={handlers.onEdit} />,
    },
  ];
}
