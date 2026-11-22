import { DefaultAttribute, DefaultCalculatedAttribute, DefaultDataSource } from "../../defaults";
import type { CalculatedAttribute, DataSource } from "../../types";

const chunkCountAttr: CalculatedAttribute = {
  ...DefaultCalculatedAttribute,
  code: "chunkCount",
  name: "Chunks",
  type: "Number",
  column: `(SELECT COUNT(*)::int FROM sabre.sb_embedding e WHERE e.resource_id = x.resource_id)`,
  isCalculated: true,
};

export const SbKnowledgeResourcesDS: DataSource = {
  ...DefaultDataSource,
  id: "SbKnowledgeResources",
  tableName: "sb_resource",
  schema: "sabre",
  attributes: [
    {
      ...DefaultAttribute,
      code: "resourceId",
      name: "Resource ID",
      type: "Text",
      column: "resource_id",
      primary: true,
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "title",
      name: "Title",
      type: "Text",
      column: "title",
      maxLength: 200,
    },
    {
      ...DefaultAttribute,
      code: "content",
      name: "Content",
      type: "Text",
      column: "content",
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "domainId",
      name: "Domain",
      type: "Text",
      column: "domain_id",
      optional: false,
    },
    {
      ...DefaultAttribute,
      code: "createdBy",
      name: "Created By",
      type: "Text",
      column: "created_by",
    },
    {
      ...DefaultAttribute,
      code: "createdAt",
      name: "Created At",
      type: "DateTime",
      column: "created_at",
    },
    chunkCountAttr,
  ],
  access: [{ roleCode: "admin", type: "Full" }],
};
