import type { ColumnDef } from "@tanstack/react-table";
import type { Sessions } from "@/lib/common/ds/types/admin/Sessions";

export const columns: ColumnDef<Sessions>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "sessiontoken", header: "Sessiontoken" },
  { accessorKey: "userid", header: "Userid" },
  { accessorKey: "expires", header: "Expires" },
];
