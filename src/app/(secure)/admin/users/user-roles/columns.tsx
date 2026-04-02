"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UserRole = {
  email: string;
  role_code: string;
  start_date: string; // date comes as string from API
  end_date: string | null;
  created_at: string | null;
};

export const columns: ColumnDef<UserRole>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => {
      const value = row.getValue("start_date") as string;
      return new Date(value).toLocaleDateString();
    },
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    cell: ({ row }) => {
      const value = row.getValue("end_date") as string | null;
      return value ? new Date(value).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const value = row.getValue("created_at") as string | null;
      return value ? new Date(value).toLocaleString() : "—";
    },
  },
];
