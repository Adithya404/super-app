"use client";

import { generateId } from "ai";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";
import type { SbKnowledgeResources } from "@/lib/common/ds/types/sabre/SbKnowledgeResources";
import { type Store, useCurrentRowSync, useDBRows } from "@/lib/common/store";
import { useDomainsLookupStore } from "../hooks/use-store";

function KnowledgeEditFormInner({ store }: { store: Store<SbKnowledgeResources> }) {
  const row = useCurrentRowSync(store);
  const domainsStore = useDomainsLookupStore();
  const domains = useDBRows(domainsStore) as SbDomains[];

  useEffect(() => {
    if (row?._status === "I" && !row.resourceId) {
      store.setValue("resourceId", generateId());
    }
    if (row?._status === "I" && !row.domainId && domains[0]) {
      store.setValue("domainId", domains[0].domainId);
    }
  }, [domains, row?._status, row?.domainId, row?.resourceId, store]);

  if (!row) {
    return null;
  }

  const fromDb = row._status !== "I";

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="kb-domain">Domain</Label>
        <Select
          disabled={fromDb}
          value={row.domainId ?? ""}
          onValueChange={(value) => store.setValue("domainId", value)}
        >
          <SelectTrigger id="kb-domain">
            <SelectValue placeholder="Select domain" />
          </SelectTrigger>
          <SelectContent>
            {domains.map((domain) => (
              <SelectItem key={domain.domainId} value={domain.domainId}>
                {domain.name} ({domain.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="kb-title">Title (optional)</Label>
        <Input
          id="kb-title"
          value={row.title || ""}
          onChange={(e) => store.setValue("title", e.target.value)}
          placeholder="Refund policy"
          maxLength={200}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="kb-content" className="after:ml-0.5 after:text-red-500 after:content-['*']">
          Content
        </Label>
        <Textarea
          id="kb-content"
          value={row.content || ""}
          onChange={(e) => store.setValue("content", e.target.value)}
          placeholder="Paste documentation or FAQ text…"
          className="min-h-40"
          required
        />
        <p className="text-muted-foreground text-xs">
          Saving re-generates embeddings for this resource. Search is limited to the selected
          domain.
        </p>
      </div>
    </div>
  );
}

export default function KnowledgeEditForm({ store }: { store?: Store<SbKnowledgeResources> }) {
  if (!store) return null;
  return <KnowledgeEditFormInner store={store} />;
}
