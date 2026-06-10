import type { ColumnDef } from "@tanstack/react-table";
import type { Sessions } from "@/lib/common/ds/types/admin/Sessions";
import { SessionActionsCell } from "../components/actions-cell";

export function getColumns(onSignOut: (sessionId: string) => Promise<void>): ColumnDef<Sessions>[] {
  return [
    { accessorKey: "id", header: "Id" },
    {
      accessorKey: "sessiontoken",
      header: "Session Token",
      cell: ({ row }) => {
        const token = row.getValue("sessiontoken") as string;
        return token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "—";
      },
    },
    { accessorKey: "useremail", header: "User Email" },
    {
      accessorKey: "expires",
      header: "Expires",
      cell: ({ row }) => {
        const value = row.getValue("expires") as string;
        return value ? new Date(value).toLocaleString() : "—";
      },
    },
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => <SessionActionsCell session={row.original} onSignOut={onSignOut} />,
    },
  ];
}
