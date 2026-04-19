import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const SessionsDS: DataSource = {
  ...DefaultDataSource,
  id: "Sessions",
  tableName: "sessions",
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
      code: "sessiontoken",
      name: "Sessiontoken",
      type: "Text",
      column: "sessionToken",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "userid",
      name: "Userid",
      type: "Text",
      column: "userId",

      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "expires",
      name: "Expires",
      type: "Date",
      column: "expires",

      optional: false,
    },
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
