// src/lib/common/ds/registry.ts
import type { DataSource } from "./types";

// We will populate this registry with actual datasource definitions
const registry: Record<string, DataSource> = {};

export function registerDataSource(ds: DataSource) {
  registry[ds.id] = ds;
}

export function getDataSource(id: string): DataSource | undefined {
  return registry[id];
}

// Example of how we'll import and register definitions
// In a real app, we might use a dynamic import or a centralized list
import { MigrationsDS } from "./definitions/admin/MigrationsDS";
import { RolesDS } from "./definitions/admin/RolesDS";
import { SessionsDS } from "./definitions/admin/SessionsDS";
import { UserRolesDS } from "./definitions/admin/UserRolesDS";
import { UsersDS } from "./definitions/admin/UsersDS";

registerDataSource(MigrationsDS);
registerDataSource(RolesDS);
registerDataSource(UsersDS);
registerDataSource(UserRolesDS);
registerDataSource(SessionsDS);
