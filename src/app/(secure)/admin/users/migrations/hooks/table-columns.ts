import type { ColumnDef } from "@tanstack/react-table";
import type { Migrations } from "@/lib/common/ds/types/admin/Migrations";

export const columns: ColumnDef<Migrations>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "checksum", header: "Checksum" },
  { accessorKey: "appliedAt", header: "AppliedAt" },
];
