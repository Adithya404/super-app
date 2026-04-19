import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const RolesDS: DataSource = {
  ...DefaultDataSource,
  id: "Roles",
  tableName: "roles",
  schema: "super",
  attributes: [
    {
      ...DefaultAttribute,
      code: "id",
      name: "Id",
      type: "Text",
      column: "id",
      primary: true,
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "role",
      name: "Role",
      type: "Text",
      column: "role",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "roleCode",
      name: "RoleCode",
      type: "Text",
      column: "role_code",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "description",
      name: "Description",
      type: "Text",
      column: "description",
    },
    {
      ...DefaultAttribute,
      code: "app",
      name: "App",
      type: "Text",
      column: "app",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "startDate",
      name: "StartDate",
      type: "Date",
      column: "start_date",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "endDate",
      name: "EndDate",
      type: "Date",
      column: "end_date",
    },
    {
      ...DefaultAttribute,
      code: "createdAt",
      name: "CreatedAt",
      type: "Date",
      column: "created_at",
    },
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
