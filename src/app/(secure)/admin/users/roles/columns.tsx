"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Roles = {
  id: string;
  role: string;
  role_code: string;
  description: string;
  app: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
};

export const columns: ColumnDef<Roles>[] = [
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "role_code",
    // header: "Role Code",
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
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "app",
    header: "App",
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
  },
  {
    accessorKey: "end_date",
    header: "End Date",
  },
  {
    accessorKey: "created_at",
    header: "Created At",
  },
];
