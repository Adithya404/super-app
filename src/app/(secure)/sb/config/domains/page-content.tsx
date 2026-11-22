"use client";

import { useCallback } from "react";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";
import DomainsEditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();

  const handleDelete = useCallback(
    async (domain: SbDomains) => {
      const id = domain.domainId;
      if (!id) return;
      await store.deleteRow?.(id);
      await store.save({ feedback: "Domain deleted" });
    },
    [store],
  );

  return (
    <PageLayoutTemplate
      title="Chat domains"
      description="Configure Sabre chat domains. Each domain has its own chat URL and knowledge base scope."
      store={store}
      getColumns={({ onEdit }) =>
        getColumns({
          onEdit,
          onDelete: handleDelete,
        })
      }
      editForm={<DomainsEditForm />}
    />
  );
}
