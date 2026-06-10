import type { ColumnDef } from "@tanstack/react-table";
import type { Users } from "@/lib/common/ds/types/admin/Users";
import { ActionsCell } from "../components/actions-cell";

export function getColumns(handlers: { onEdit: (user: Users) => void }): ColumnDef<Users>[] {
  return [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "emailverified",
      header: "Email Verified",
      cell: ({ row }) => {
        const value = row.getValue("emailverified") as string | null | undefined;
        return value ? new Date(value).toLocaleDateString() : "—";
      },
    },
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => <ActionsCell user={row.original} onEdit={handlers.onEdit} />,
    },
  ];
}
