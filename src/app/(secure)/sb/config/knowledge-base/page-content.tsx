"use client";

import { useCallback, useMemo } from "react";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";
import type { SbKnowledgeResources } from "@/lib/common/ds/types/sabre/SbKnowledgeResources";
import { useDBRows } from "@/lib/common/store";
import KnowledgeEditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useDomainsLookupStore, useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();
  const domainsStore = useDomainsLookupStore();
  const domains = useDBRows(domainsStore) as SbDomains[];

  const domainById = useMemo(
    () => new Map(domains.map((domain) => [domain.domainId, domain])),
    [domains],
  );

  const handleDelete = useCallback(
    async (row: SbKnowledgeResources) => {
      const id = row.resourceId;
      if (!id) return;
      await store.deleteRow?.(id);
      await store.save({ feedback: "Knowledge resource deleted" });
    },
    [store],
  );

  return (
    <PageLayoutTemplate
      title="Knowledge base"
      description="Manage plain-text resources and embeddings scoped to a chat domain."
      store={store}
      getColumns={({ onEdit }) => getColumns(domainById, { onEdit, onDelete: handleDelete })}
      editForm={<KnowledgeEditForm />}
    />
  );
}
