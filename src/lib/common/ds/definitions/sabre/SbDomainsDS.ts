/* Copyright (c) 2024-present ... */

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
      maxLength: 128,
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
      maxLength: 500,
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
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "createdBy",
      name: "Created By",
      type: "Text",
      column: "created_by",
      maxLength: 128,
      optional: false,
    },
  ],

  access: [{ roleCode: "admin", type: "Full" }],
};
