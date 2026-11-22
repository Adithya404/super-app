import { DefaultAttribute, DefaultDataSource } from "../../defaults";
import type { DataSource } from "../../types";

export const SbDomainsDS: DataSource = {
  ...DefaultDataSource,
  id: "SbDomains",
  tableName: "sb_domain",
  schema: "sabre",
  attributes: [
    {
      ...DefaultAttribute,
      code: "domainId",
      name: "Domain ID",
      type: "Text",
      column: "domain_id",
      primary: true,
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "slug",
      name: "Slug",
      type: "Text",
      column: "slug",
      optional: false,
      maxLength: 64,
    },
    {
      ...DefaultAttribute,
      code: "name",
      name: "Name",
      type: "Text",
      column: "name",
      optional: false,
      maxLength: 120,
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
      code: "isActive",
      name: "Active",
      type: "Boolean",
      column: "is_active",
      optional: false,
      defaultValue: true,
    },
    {
      ...DefaultAttribute,
      code: "createdAt",
      name: "Created At",
      type: "DateTime",
      column: "created_at",
    },
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
