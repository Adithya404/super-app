"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Users } from "@/lib/common/ds/types/admin/Users";
import { type Store, useCurrentRowSync } from "@/lib/common/store";

function UsersEditFormInner({ store }: { store: Store<Users> }) {
  const row = useCurrentRowSync(store);

  useEffect(() => {
    if (row?._status === "I" && !row.id) {
      store.setValue("id", crypto.randomUUID());
    }
  }, [row?._status, row?.id, store]);

  if (!row) {
    return null;
  }

  const isNew = row._status === "I";

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={row.name || ""}
          onChange={(e) => store.setValue("name", e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email" className="after:ml-0.5 after:text-red-500 after:content-['*']">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          required
          disabled={!isNew}
          value={row.email || ""}
          onChange={(e) => store.setValue("email", e.target.value)}
          placeholder="user@example.com"
        />
      </div>

      {isNew && (
        <div className="grid gap-2">
          <Label htmlFor="password" className="after:ml-0.5 after:text-red-500 after:content-['*']">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={row.password || ""}
            onChange={(e) => store.setValue("password", e.target.value)}
            placeholder="Minimum 8 characters"
          />
        </div>
      )}
    </div>
  );
}

export default function UsersEditForm({ store }: { store?: Store<Users> }) {
  if (!store) return null;
  return <UsersEditFormInner store={store} />;
}
