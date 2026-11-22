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
import type { SbKnowledgeResources } from "@/lib/common/ds/types/sabre/SbKnowledgeResources";

function previewContent(content: string | undefined): string {
  const trimmed = content?.trim() ?? "";
  if (!trimmed) return "—";
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

function KnowledgeActionsCell({
  row,
  onEdit,
  onDelete,
}: {
  row: SbKnowledgeResources;
  onEdit: (row: SbKnowledgeResources) => void;
  onDelete: (row: SbKnowledgeResources) => void;
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
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getColumns(
  domainById: Map<string, SbDomains>,
  handlers: {
    onEdit: (row: SbKnowledgeResources) => void;
    onDelete: (row: SbKnowledgeResources) => void;
  },
): ColumnDef<SbKnowledgeResources>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => row.original.title?.trim() || "Untitled",
    },
    {
      accessorKey: "domainId",
      header: "Domain",
      cell: ({ row }) => domainById.get(row.original.domainId)?.name ?? row.original.domainId,
    },
    {
      accessorKey: "content",
      header: "Preview",
      cell: ({ row }) => previewContent(row.original.content),
    },
    {
      accessorKey: "chunkCount",
      header: "Chunks",
      cell: ({ row }) => row.original.chunkCount ?? "—",
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
        <KnowledgeActionsCell
          row={row.original}
          onEdit={handlers.onEdit}
          onDelete={handlers.onDelete}
        />
      ),
    },
  ];
}
