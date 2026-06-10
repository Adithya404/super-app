"use client";
import { useCallback, useMemo } from "react";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();

  const handleSignOut = useCallback(
    async (sessionId: string) => {
      const response = await fetch(`/api/admin/user-sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to sign out user");
      }
      await store.refetch();
    },
    [store],
  );

  const columns = useMemo(() => getColumns(handleSignOut), [handleSignOut]);

  return (
    <PageLayoutTemplate
      title="Sessions"
      description="Manage Sessions data."
      columns={columns}
      store={store}
    />
  );
}
