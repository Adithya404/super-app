import type { ColumnDef } from "@tanstack/react-table";
import type { Users } from "@/lib/common/ds/types/admin/Users";

export const columns: ColumnDef<Users>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "emailverified", header: "Emailverified" },
  { accessorKey: "image", header: "Image" },
  { accessorKey: "password", header: "Password" },
];
