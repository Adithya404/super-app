"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/common/date";
import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";

function DomainActionsCell({
  domain,
  onEdit,
  onDelete,
}: {
  domain: SbDomains;
  onEdit: (domain: SbDomains) => void;
  onDelete: (domain: SbDomains) => void;
}) {
  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(domain)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(domain)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getColumns(handlers: {
  onEdit: (domain: SbDomains) => void;
  onDelete: (domain: SbDomains) => void;
}): ColumnDef<SbDomains>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "slug", header: "Slug" },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (row.original.isActive ? "Yes" : "No"),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description?.trim() || "—",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => (
        <DomainActionsCell
          domain={row.original}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      ),
    },
  ];
}
