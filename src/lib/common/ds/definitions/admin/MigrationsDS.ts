import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const MigrationsDS: DataSource = {
  ...DefaultDataSource,
  id: "Migrations",
  tableName: "migrations",
  schema: "super",
  attributes: [
    {
      ...DefaultAttribute,
      code: "id",
      name: "Id",
      type: "Number",
      column: "id",
      primary: true,
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "name",
      name: "Name",
      type: "Text",
      column: "name",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "checksum",
      name: "Checksum",
      type: "Text",
      column: "checksum",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "appliedAt",
      name: "AppliedAt",
      type: "Date",
      column: "applied_at",
    },
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
