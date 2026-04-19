import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const UsersDS: DataSource = {
  ...DefaultDataSource,
  id: "Users",
  tableName: "users",
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
      code: "name",
      name: "Name",
      type: "Text",
      column: "name",
    },
    {
      ...DefaultAttribute,
      code: "email",
      name: "Email",
      type: "Text",
      column: "email",
    },
    {
      ...DefaultAttribute,
      code: "emailverified",
      name: "Emailverified",
      type: "Date",
      column: "emailVerified",
    },
    {
      ...DefaultAttribute,
      code: "image",
      name: "Image",
      type: "Text",
      column: "image",
    },
    {
      ...DefaultAttribute,
      code: "password",
      name: "Password",
      type: "Text",
      column: "password",
    },
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
