// src/app/(secure)/admin/system/code-generate/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateDataSource,
  generateHook,
  generateInterface,
  generatePageContent,
  generateTableColumns,
  toKebabCase,
  toPascalCase,
} from "@/lib/admin/scaffold-utils";

interface TableInfo {
  table_schema: string;
  table_name: string;
}

const MODULES = [
  { label: "Pingpal", value: "pp" },
  { label: "Tour Pal", value: "tp" },
  { label: "Asset Management", value: "am" },
  { label: "HR", value: "hr" },
  { label: "Admin", value: "admin" },
  { label: "Dashboard", value: "dashboard" },
];

const SUB_MODULES: Record<string, { label: string; value: string }[]> = {
  admin: [
    { label: "Users", value: "users" },
    { label: "System", value: "system" },
  ],
};

export default function CodeGeneratePage() {
  const [selectedTable, setSelectedTable] = useState<{ schema: string; name: string } | null>(null);
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [selectedSubModule, setSelectedSubModule] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: tablesData, isLoading: isLoadingTables } = useQuery({
    queryKey: ["admin", "db", "tables"],
    queryFn: () => fetch("/api/admin/db/tables").then((res) => res.json()),
  });

  const { data: columnsData } = useQuery({
    queryKey: ["admin", "db", "columns", selectedTable],
    queryFn: () =>
      fetch(
        `/api/admin/db/columns?table=${selectedTable?.name}&schema=${selectedTable?.schema}`,
      ).then((res) => res.json()),
    enabled: !!selectedTable,
  });

  // Reset submodule when module changes
  useEffect(() => {
    setSelectedSubModule(null);
  }, []);

  const handleGenerate = async () => {
    if (!selectedTable || !columnsData) return;

    setIsGenerating(true);
    try {
      const tableName = selectedTable.name;
      const schema = selectedTable.schema;
      const className = toPascalCase(tableName);
      const kebabName = toKebabCase(tableName);
      const moduleValue = selectedModule.value;
      const subModule = selectedSubModule?.value;
      const columns = columnsData.data;

      const baseAppPath = subModule
        ? `src/app/(secure)/${moduleValue}/${subModule}/${kebabName}`
        : `src/app/(secure)/${moduleValue}/${kebabName}`;

      const files = [
        {
          path: `src/lib/common/ds/types/${moduleValue}/${className}.ts`,
          content: generateInterface(className, columns),
        },
        {
          path: `src/lib/common/ds/definitions/${moduleValue}/${className}DS.ts`,
          content: generateDataSource(className, tableName, schema, columns, moduleValue),
        },
        {
          path: `${baseAppPath}/page.tsx`,
          content: `import PageContent from "./page-content";\n\nexport default function Page() {\n  return <PageContent />;\n}\n`,
        },
        {
          path: `${baseAppPath}/page-content.tsx`,
          content: generatePageContent(className, toPascalCase(tableName)),
        },
        {
          path: `${baseAppPath}/hooks/use-store.ts`,
          content: generateHook(className, moduleValue, kebabName),
        },
        {
          path: `${baseAppPath}/hooks/table-columns.ts`,
          content: generateTableColumns(className, moduleValue, columns),
        },
      ];

      const res = await fetch("/api/admin/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      if (!res.ok) throw new Error("Failed to scaffold");

      toast.success("Code generated and written successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSubModules = SUB_MODULES[selectedModule.value] || [];

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 font-bold text-3xl">Code Generate</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="target-module" className="font-medium text-sm">
            Target Module
          </label>
          <select
            id="target-module"
            className="rounded border bg-background p-2"
            value={selectedModule.value}
            onChange={(e) =>
              setSelectedModule(MODULES.find((m) => m.value === e.target.value) || MODULES[0])
            }
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="sub-module" className="font-medium text-sm">
            Sub-Module (Optional)
          </label>
          <select
            id="sub-module"
            className="rounded border bg-background p-2"
            value={selectedSubModule?.value || ""}
            onChange={(e) =>
              setSelectedSubModule(
                currentSubModules.find((m) => m.value === e.target.value) || null,
              )
            }
          >
            <option value="">None</option>
            {currentSubModules.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="database-table" className="font-medium text-sm">
            Database Table
          </label>
          <select
            id="database-table"
            className="rounded border bg-background p-2"
            value={selectedTable ? `${selectedTable.schema}.${selectedTable.name}` : ""}
            onChange={(e) => {
              if (!e.target.value) {
                setSelectedTable(null);
                return;
              }
              const [schema, name] = e.target.value.split(".");
              setSelectedTable({ schema, name });
            }}
          >
            <option value="">Select a table...</option>
            {tablesData?.data?.map((t: TableInfo) => (
              <option
                key={`${t.table_schema}.${t.table_name}`}
                value={`${t.table_schema}.${t.table_name}`}
              >
                {t.table_schema}.{t.table_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTable && columnsData && (
        <div className="mb-8 rounded-lg border bg-slate-50 p-6 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-lg">
            Preview: {toPascalCase(selectedTable.name)}
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Schema:</strong> {selectedTable.schema}
            </p>
            <p>
              <strong>Table:</strong> {selectedTable.name}
            </p>
            <p>
              <strong>Columns:</strong> {columnsData.data.length}
            </p>
            <p>
              <strong>Target Path:</strong> src/app/(secure)/{selectedModule.value}
              {selectedSubModule ? `/${selectedSubModule.value}` : ""}/
              {toKebabCase(selectedTable.name)}
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 w-full rounded-md bg-primary py-2 font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate & Write to Codebase"}
          </Button>
        </div>
      )}

      {isLoadingTables && <p className="text-center text-muted-foreground">Loading tables...</p>}
    </div>
  );
}
