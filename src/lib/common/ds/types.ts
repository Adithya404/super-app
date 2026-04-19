// src/lib/common/ds/types.ts

export type DataType = "Text" | "Number" | "Boolean" | "Date" | "DateTime" | "UUID" | "JSON";

export interface Attribute {
  code: string;
  name: string;
  type: DataType;
  column: string;
  primary?: boolean;
  optional?: boolean;
  maxLength?: number;
  defaultValue?: unknown;
}

export interface CalculatedAttribute extends Omit<Attribute, "column"> {
  column: string; // This will hold the SQL snippet
  isCalculated: true;
}

export interface Access {
  roleCode: string;
  type: "Full" | "ReadOnly" | "None";
}

export interface DataSource {
  id: string;
  tableName: string;
  schema?: string;
  attributes: Array<Attribute | CalculatedAttribute>;
  access: Access[];
}

export interface StoreOptions {
  datasourceId: string;
  page?: string;
  alias?: string;
  limit?: number;
  offset?: number;
  includeCount?: boolean;
  autoQuery?: boolean;
  filters?: Record<string, unknown>;
}
