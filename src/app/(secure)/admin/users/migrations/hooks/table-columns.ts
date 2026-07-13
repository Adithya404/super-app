import type { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/lib/common/date";
import type { Migrations } from "@/lib/common/ds/types/admin/Migrations";

export const columns: ColumnDef<Migrations>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "checksum", header: "Checksum" },
  {
    accessorKey: "appliedAt",
    header: "Applied At",
    cell: ({ row }) => formatDateTime(row.getValue("appliedAt") as string | Date | null),
  },
];
