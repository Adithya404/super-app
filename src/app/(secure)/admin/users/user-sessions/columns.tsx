"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Session = {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
};

// export const columns: ColumnDef<Session>[] = [
//   {
//     accessorKey: "id",
//     header: "ID",
//   },
//   {
//     accessorKey: "userId",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant="ghost"
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//         >
//           User ID
//           <ArrowUpDown className="ml-2 h-4 w-4" />
//         </Button>
//       );
//     },
//   },
//   {
//     accessorKey: "sessionToken",
//     header: "Session Token",
//     cell: ({ row }) => {
//       const token = row.getValue("sessionToken") as string;
//       return `${token.slice(0, 6)}...${token.slice(-4)}`;
//     },
//   },
//   {
//     accessorKey: "expires",
//     header: "Expires",
//     cell: ({ row }) => {
//       const value = row.getValue("expires") as string;
//       const date = new Date(value);

//       return date.toLocaleString();
//     },
//   },
//   {
//     id: "status",
//     header: "Status",
//     cell: ({ row }) => {
//       const value = row.getValue("expires") as string;
//       const isExpired = new Date(value) < new Date();

//       return isExpired ? "Expired" : "Active";
//     },
//   },
//   {
//     id: "actions",
//     cell: ({ row }) => {
//       const sessionId = row.original;

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">Open menu</span>
//               <MoreHorizontal className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//             <DropdownMenuItem onClick={handleForceLogout(sessionId)}>Logout</DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>+Add More</DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//   },
// ];
export const getColumns = (onLogout: (id: string) => void): ColumnDef<Session>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "userId",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        User ID
      </Button>
    ),
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
      const date = new Date(row.getValue("expires"));
      return date.toLocaleString();
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isExpired = new Date(row.getValue("expires")) < new Date();
      return isExpired ? "Expired" : "Active";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const session = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => onLogout(session.id)}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
