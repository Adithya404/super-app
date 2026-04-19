// src/lib/admin/scaffold-utils.ts
import type { DataType } from "../common/ds/types";

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  is_primary: boolean;
}

export function mapPgTypeToDataType(pgType: string): DataType {
  const type = pgType.toLowerCase();
  if (
    type.includes("character varying") ||
    type.includes("text") ||
    type.includes("varchar") ||
    type.includes("char")
  )
    return "Text";
  if (
    type.includes("int") ||
    type.includes("numeric") ||
    type.includes("double") ||
    type.includes("real") ||
    type.includes("decimal")
  )
    return "Number";
  if (type.includes("boolean") || type.includes("bool")) return "Boolean";
  if (type.includes("timestamp") || type.includes("date") || type.includes("time")) return "Date";
  if (type.includes("uuid")) return "UUID";
  if (type.includes("json")) return "JSON";
  return "Text";
}

export function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function generateInterface(className: string, columns: ColumnInfo[]): string {
  const properties = columns
    .map((c) => {
      const tsType = mapDataTypeToTsType(mapPgTypeToDataType(c.data_type));
      const optional = c.is_nullable === "YES" ? "?" : "";
      return `  ${toCamelCase(c.column_name)}${optional}: ${tsType};`;
    })
    .join("\n");

  return `export interface ${className} {\n${properties}\n}\n`;
}

function mapDataTypeToTsType(dataType: DataType): string {
  switch (dataType) {
    case "Text":
    case "UUID":
      return "string";
    case "Number":
      return "number";
    case "Boolean":
      return "boolean";
    case "Date":
    case "DateTime":
      return "Date";
    case "JSON":
      return "any";
    default:
      return "any";
  }
}

export function generateDataSource(
  className: string,
  tableName: string,
  schema: string,
  columns: ColumnInfo[],
  module: string,
): string {
  const attributes = columns
    .map((c) => {
      const dataType = mapPgTypeToDataType(c.data_type);
      return `    {
      ...DefaultAttribute,
      code: '${toCamelCase(c.column_name)}',
      name: '${toPascalCase(c.column_name)}',
      type: '${dataType}',
      column: '${c.column_name}',
      ${c.is_primary ? "primary: true," : ""}
      ${c.is_nullable === "NO" ? "optional: false," : ""}
    },`;
    })
    .join("\n");

  return `import type { DataSource } from '../../types';
import { DefaultDataSource, DefaultAttribute } from '../../defaults';

export const ${className}DS: DataSource = {
  ...DefaultDataSource,
  id: '${className}',
  tableName: '${tableName}',
  schema: '${schema}',
  attributes: [
${attributes}
  ],
  access: [
    { roleCode: 'admin', type: 'Full' },
  ],
};
`;
}

export function generateHook(className: string, _module: string, path: string): string {
  const dsId = className;
  return `import { useStore as useBaseStore } from '@/lib/common/store/use-store';

export function useStore() {
  return useBaseStore({
    datasourceId: '${dsId}',
    page: '${path}-page',
    alias: '${path}-all',
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
`;
}

export function generateTableColumns(
  className: string,
  module: string,
  columns: ColumnInfo[],
): string {
  return `import type { ColumnDef } from "@tanstack/react-table";
import type { ${className} } from "@/lib/common/ds/types/${module}/${className}";

export const columns: ColumnDef<${className}>[] = [
${columns.map((c) => `  { accessorKey: "${toCamelCase(c.column_name)}", header: "${toPascalCase(c.column_name)}" },`).join("\n")}
];
`;
}

export function generatePageContent(_className: string, title: string): string {
  return `"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import { useStore } from "./hooks/use-store";
import { columns } from "./hooks/table-columns";

export default function PageContent() {
  const store = useStore();

  return (
    <PageLayoutTemplate
      title="${title}"
      description="Manage ${title} data."
      columns={columns}
      store={store}
    />
  );
}
`;
}
