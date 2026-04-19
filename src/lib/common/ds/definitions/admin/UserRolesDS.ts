import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const UserRolesDS: DataSource = {
  ...DefaultDataSource,
  id: "UserRoles",
  tableName: "user_roles",
  schema: "super",
  attributes: [
    {
      ...DefaultAttribute,
      code: "email",
      name: "Email",
      type: "Text",
      column: "email",
      primary: true,
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "roleCode",
      name: "RoleCode",
      type: "Text",
      column: "role_code",
      primary: true,
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
