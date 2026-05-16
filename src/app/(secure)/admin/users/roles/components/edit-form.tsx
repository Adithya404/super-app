/* Copyright (c) 2024-present Wayvo Corp. */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Roles } from "@/lib/common/ds/types/admin/Roles";
import type { Store } from "@/lib/common/store/types";

export default function RolesEditForm({ store }: { store?: Store<Roles> }) {
  // Get the active transient row if we are in "Add New" mode
  const row = store?.currentRow;

  if (!row || !store) {
    return null;
  }

  // Since we are only supporting Add New via Dialog currently, it's not from DB.
  const fromDB = row._status !== "I";

  const handleChange = (field: string, value: string) => {
    if (row._cid) {
      store.updateRow(row._cid, { [field]: value });
    }
  };

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="roleCode">Role Code</Label>
        <Input
          id="roleCode"
          disabled={fromDB}
          value={row.roleCode || ""}
          onChange={(e) => handleChange("roleCode", e.target.value)}
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
          onChange={(e) => handleChange("role", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="app">App</Label>
        <Input
          id="app"
          value={row.app || ""}
          onChange={(e) => handleChange("app", e.target.value)}
          placeholder="super-app"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          type="date"
          value={row.startDate ? new Date(row.startDate).toISOString().split("T")[0] : ""}
          onChange={(e) => handleChange("startDate", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={row.endDate ? new Date(row.endDate).toISOString().split("T")[0] : ""}
          onChange={(e) => handleChange("endDate", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={row.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>
    </div>
  );
}
