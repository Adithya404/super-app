import type { ColumnDef } from "@tanstack/react-table";
import type { UserRoles } from "@/lib/common/ds/types/admin/UserRoles";

export const columns: ColumnDef<UserRoles>[] = [
  { accessorKey: "email", header: "Email" },
  { accessorKey: "roleCode", header: "RoleCode" },
  {
    accessorKey: "startDate",
    header: "StartDate",
    cell: ({ row }) => {
      const value = row.getValue("startDate") as string;
      return new Date(value).toLocaleDateString();
    },
  },
  {
    accessorKey: "endDate",
    header: "EndDate",
    cell: ({ row }) => {
      const value = row.getValue("endDate") as string;
      return new Date(value).toLocaleDateString();
    },
  },
  {
    accessorKey: "createdAt",
    header: "CreatedAt",
    cell: ({ row }) => {
      const value = row.getValue("createdAt") as string;
      return new Date(value).toLocaleDateString();
    },
  },
];
