"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Users = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
};

export const columns: ColumnDef<Users>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: "Email Verified",
    cell: ({ row }) => {
      const value = row.getValue("emailVerified") as Date | null;
      return value ? new Date(value).toLocaleString() : "Not verified";
    },
  },
  //   {
  //     accessorKey: "image",
  //     header: "Image",
  //     cell: ({ row }) => {
  //       const value = row.getValue("image") as string | null;
  //       return value ? <img src={value} alt="user" className="h-8 w-8 rounded-full" /> : "—";
  //     },
  //   },
  //   {
  //     accessorKey: "password",
  //     header: "Password",
  //     cell: () => "••••••••", // never show actual password
  //   },
];
