"use client";

import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SbDomains } from "@/lib/common/ds/types/sabre/SbDomains";
import { type Store, useCurrentRowSync } from "@/lib/common/store";

function DomainsEditFormInner({ store }: { store: Store<SbDomains> }) {
  const row = useCurrentRowSync(store);

  useEffect(() => {
    if (row?._status === "I" && row.isActive === undefined) {
      store.setValue("isActive", true);
    }
  }, [row?._status, row?.isActive, store]);

  if (!row) {
    return null;
  }

  const fromDb = row._status !== "I";

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="slug" className="after:ml-0.5 after:text-red-500 after:content-['*']">
          Slug
        </Label>
        <Input
          id="slug"
          disabled={fromDb}
          value={row.slug || ""}
          onChange={(e) => store.setValue("slug", e.target.value.toLowerCase())}
          placeholder="e.g. hr"
        />
        <p className="text-muted-foreground text-xs">
          Chat URL: /sb/config/chat/&lt;slug&gt;. Lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">
          Display name
        </Label>
        <Input
          id="name"
          value={row.name || ""}
          onChange={(e) => store.setValue("name", e.target.value)}
          placeholder="HR"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={row.description || ""}
          onChange={(e) => store.setValue("description", e.target.value)}
          placeholder="What this domain is for"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="isActive"
          checked={row.isActive !== false}
          onCheckedChange={(checked) => store.setValue("isActive", checked === true)}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
    </div>
  );
}

export default function DomainsEditForm({ store }: { store?: Store<SbDomains> }) {
  if (!store) return null;
  return <DomainsEditFormInner store={store} />;
}
