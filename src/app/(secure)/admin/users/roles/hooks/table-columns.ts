import type { ColumnDef } from "@tanstack/react-table";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";

export const columns: ColumnDef<Roles>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "roleCode", header: "RoleCode" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "app", header: "App" },
  { accessorKey: "startDate", header: "StartDate" },
  { accessorKey: "endDate", header: "EndDate" },
  { accessorKey: "createdAt", header: "CreatedAt" },
];
