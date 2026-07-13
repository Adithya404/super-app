import type { ColumnDef } from "@tanstack/react-table";
import { formatDateOnly } from "@/lib/common/date";
import type { UserRoles } from "@/lib/common/ds/types/admin/UserRoles";

export const columns: ColumnDef<UserRoles>[] = [
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "roleName",
    header: "Role",
    cell: ({ row }) => row.original.roleName || row.original.roleCode || "—",
  },
  { accessorKey: "roleCode", header: "Role Code" },
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
];
