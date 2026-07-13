/* Copyright (c) 2024-present Wayvo Corp. */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDateLocal, toDateInputValue } from "@/lib/common/date";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";
import { type Store, useCurrentRowSync } from "@/lib/common/store";

function RolesEditFormInner({ store }: { store: Store<Roles> }) {
  const row = useCurrentRowSync(store);

  if (!row) {
    return null;
  }

  const fromDB = row._status !== "I";

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="roleCode">Role Code</Label>
        <Input
          id="roleCode"
          disabled={fromDB}
          value={row.roleCode || ""}
          onChange={(e) => store.setValue("roleCode", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role" className="after:ml-0.5 after:text-red-500 after:content-['*']">
          Role Name
        </Label>
        <Input
          id="role"
          required
          value={row.role || ""}
          onChange={(e) => store.setValue("role", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="app">App</Label>
        <Input
          id="app"
          value={row.app || ""}
          onChange={(e) => store.setValue("app", e.target.value)}
          placeholder="super-app"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={toDateInputValue(row.startDate)}
          onChange={(e) =>
            store.setValue("startDate", e.target.value ? parseDateLocal(e.target.value) : undefined)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={toDateInputValue(row.endDate)}
          onChange={(e) =>
            store.setValue("endDate", e.target.value ? parseDateLocal(e.target.value) : undefined)
          }
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={row.description || ""}
          onChange={(e) => store.setValue("description", e.target.value)}
        />
      </div>
    </div>
  );
}

export default function RolesEditForm({ store }: { store?: Store<Roles> }) {
  if (!store) return null;
  return <RolesEditFormInner store={store} />;
}
