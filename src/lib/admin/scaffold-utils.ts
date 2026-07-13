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
  return `import { useStore as useBaseStore } from "@/lib/common/store";

export function useStore() {
  return useBaseStore({
    datasourceId: "${dsId}",
    page: "${path}-page",
    alias: "${path}-all",
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
  hasEditForm = false,
): string {
  const hasDate = columns.some((c) => {
    const t = mapPgTypeToDataType(c.data_type);
    return t === "Date" || t === "DateTime";
  });

  const imports = [
    hasEditForm ? `"use client";` : null,
    `import type { ColumnDef } from "@tanstack/react-table";`,
    hasEditForm ? `import { MoreHorizontal, Pencil } from "lucide-react";` : null,
    hasEditForm ? `import { Button } from "@/components/ui/button";` : null,
    hasEditForm
      ? `import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`
      : null,
    hasDate ? `import { formatDateOnly } from "@/lib/common/date";` : null,
    `import type { ${className} } from "@/lib/common/ds/types/${module}/${className}";`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const columnDefs = columns
    .map((c) => {
      const key = toCamelCase(c.column_name);
      const header = toPascalCase(c.column_name);
      const dataType = mapPgTypeToDataType(c.data_type);
      if (dataType === "Date" || dataType === "DateTime") {
        return `  {
    accessorKey: "${key}",
    header: "${header}",
    cell: ({ row }) => formatDateOnly(row.getValue("${key}") as string | Date | null),
  },`;
      }
      return `  { accessorKey: "${key}", header: "${header}" },`;
    })
    .join("\n");

  if (!hasEditForm) {
    return `${imports}

export const columns: ColumnDef<${className}>[] = [
${columnDefs}
];
`;
  }

  return `${imports}

function ActionsCell({
  row,
  onEdit,
}: {
  row: ${className};
  onEdit: (row: ${className}) => void;
}) {
  return (
    <div className="px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function getColumns(handlers: {
  onEdit: (row: ${className}) => void;
}): ColumnDef<${className}>[] {
  return [
${columnDefs}
    {
      id: "actions",
      header: "",
      size: 48,
      cell: ({ row }) => <ActionsCell row={row.original} onEdit={handlers.onEdit} />,
    },
  ];
}
`;
}

export function toLabelText(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function generatePageContent(
  className: string,
  title: string,
  hasEditForm: boolean = false,
): string {
  if (hasEditForm) {
    return `"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import ${className}EditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();

  return (
    <PageLayoutTemplate
      title="${title}"
      description="Manage ${title} data."
      getColumns={getColumns}
      store={store}
      editForm={<${className}EditForm />}
    />
  );
}
`;
  }

  return `"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import { columns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

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

export function generateEditFormContent(
  className: string,
  module: string,
  columns: ColumnInfo[],
): string {
  const hasBoolean = columns.some((c) => mapPgTypeToDataType(c.data_type) === "Boolean");
  const hasDate = columns.some((c) => {
    const t = mapPgTypeToDataType(c.data_type);
    return t === "Date" || t === "DateTime";
  });

  const imports = [
    `"use client";`,
    ``,
    `import { Input } from "@/components/ui/input";`,
    `import { Label } from "@/components/ui/label";`,
    hasBoolean ? `import { Checkbox } from "@/components/ui/checkbox";` : null,
    hasDate ? `import { parseDateLocal, toDateInputValue } from "@/lib/common/date";` : null,
    `import type { ${className} } from "@/lib/common/ds/types/${module}/${className}";`,
    `import { useCurrentRowSync, type Store } from "@/lib/common/store";`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const fields = columns
    .map((c) => {
      const camelName = toCamelCase(c.column_name);
      const labelText = toLabelText(c.column_name);
      const isRequired = c.is_nullable === "NO";
      const isPrimary = c.is_primary;
      const dataType = mapPgTypeToDataType(c.data_type);

      const labelTag = `<Label htmlFor="${camelName}"${isRequired ? " className=\"after:ml-0.5 after:text-red-500 after:content-['*']\"" : ""}>${labelText}</Label>`;

      if (dataType === "Boolean") {
        return `      <div className="flex items-center gap-2 py-2">
        <Checkbox
          id="${camelName}"${isPrimary ? "\n          disabled={fromDB}" : ""}
          checked={!!row.${camelName}}
          onCheckedChange={(checked) => store.setValue("${camelName}", !!checked)}
        />
        ${labelTag}
      </div>`;
      }

      if (dataType === "Number") {
        return `      <div className="grid gap-2">
        ${labelTag}
        <Input
          id="${camelName}"
          type="number"${isPrimary ? "\n          disabled={fromDB}" : ""}
          value={row.${camelName} ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            store.setValue("${camelName}", val === "" ? undefined : Number(val));
          }}
        />
      </div>`;
      }

      if (dataType === "Date" || dataType === "DateTime") {
        return `      <div className="grid gap-2">
        ${labelTag}
        <Input
          id="${camelName}"
          type="date"${isPrimary ? "\n          disabled={fromDB}" : ""}
          value={toDateInputValue(row.${camelName})}
          onChange={(e) =>
            store.setValue("${camelName}", e.target.value ? parseDateLocal(e.target.value) : undefined)
          }
        />
      </div>`;
      }

      return `      <div className="grid gap-2">
        ${labelTag}
        <Input
          id="${camelName}"${isPrimary ? "\n          disabled={fromDB}" : ""}
          value={row.${camelName} || ""}
          onChange={(e) => store.setValue("${camelName}", e.target.value)}
        />
      </div>`;
    })
    .join("\n\n");

  return `${imports}

function ${className}EditFormInner({ store }: { store: Store<${className}> }) {
  const row = useCurrentRowSync(store);

  if (!row) {
    return null;
  }

  const fromDB = row._status !== "I";

  return (
    <div className="grid gap-4 py-2">
${fields}
    </div>
  );
}

export default function ${className}EditForm({ store }: { store?: Store<${className}> }) {
  if (!store) return null;
  return <${className}EditFormInner store={store} />;
}
`;
}
