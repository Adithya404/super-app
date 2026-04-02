"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Session = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
};

export const columns: ColumnDef<Session>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "userId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          User ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "sessionToken",
    header: "Session Token",
    cell: ({ row }) => {
      const token = row.getValue("sessionToken") as string;
      return `${token.slice(0, 6)}...${token.slice(-4)}`;
    },
  },
  {
    accessorKey: "expires",
    header: "Expires",
    cell: ({ row }) => {
      const value = row.getValue("expires") as string;
      const date = new Date(value);

      return date.toLocaleString();
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue("expires") as string;
      const isExpired = new Date(value) < new Date();

      return isExpired ? "Expired" : "Active";
    },
  },
];
