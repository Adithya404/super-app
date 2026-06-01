// src/app/(secure)/admin/system/code-generate/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateDataSource,
  generateEditFormContent,
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
  tp: [{ label: "Config", value: "config" }],
};

export default function CodeGeneratePage() {
  const [selectedTable, setSelectedTable] = useState<{ schema: string; name: string } | null>(null);
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [selectedSubModule, setSelectedSubModule] = useState<{
    label: string;
    value: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateEditForm, setGenerateEditForm] = useState(false);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <false positive>
  useEffect(() => {
    setSelectedSubModule(null);
  }, [selectedModule]);

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
          content: generateDataSource(className, tableName, schema, columns),
        },
        {
          path: `${baseAppPath}/page.tsx`,
          content: `import PageContent from "./page-content";\n\nexport default function Page() {\n  return <PageContent />;\n}\n`,
        },
        {
          path: `${baseAppPath}/page-content.tsx`,
          content: generatePageContent(className, toPascalCase(tableName), generateEditForm),
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

      if (generateEditForm) {
        files.push({
          path: `${baseAppPath}/components/edit-form.tsx`,
          content: generateEditFormContent(className, moduleValue, columns),
        });
      }

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
          <Label htmlFor="target-module">Target Module</Label>
          <Select
            value={selectedModule.value}
            onValueChange={(val) =>
              setSelectedModule(MODULES.find((m) => m.value === val) || MODULES[0])
            }
          >
            <SelectTrigger id="target-module" className="w-full">
              <SelectValue placeholder="Select module" />
            </SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="sub-module">Sub-Module (Optional)</Label>
          <Select
            value={selectedSubModule?.value || "none"}
            onValueChange={(val) =>
              setSelectedSubModule(currentSubModules.find((m) => m.value === val) || null)
            }
          >
            <SelectTrigger id="sub-module" className="w-full">
              <SelectValue placeholder="Select sub-module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {currentSubModules.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="database-table">Database Table</Label>
          <Combobox
            value={selectedTable ? `${selectedTable.schema}.${selectedTable.name}` : ""}
            onValueChange={(val) => {
              if (!val) {
                setSelectedTable(null);
                return;
              }
              const [schema, name] = val.split(".");
              setSelectedTable({ schema, name });
            }}
          >
            <ComboboxInput placeholder="Search table..." id="database-table" className="w-full" />
            <ComboboxContent>
              <ComboboxEmpty>No table found.</ComboboxEmpty>
              <ComboboxList>
                {tablesData?.data?.map((t: TableInfo) => (
                  <ComboboxItem
                    key={`${t.table_schema}.${t.table_name}`}
                    value={`${t.table_schema}.${t.table_name}`}
                  >
                    {t.table_schema}.{t.table_name}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2 md:mt-6">
          <Checkbox
            id="generate-edit-form"
            checked={generateEditForm}
            onCheckedChange={(checked) => setGenerateEditForm(!!checked)}
          />
          <Label htmlFor="generate-edit-form" className="cursor-pointer font-medium text-sm">
            Generate Edit Form
          </Label>
        </div>
      </div>

      {selectedTable && columnsData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Preview: {toPascalCase(selectedTable.name)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-semibold">Schema:</span>
              <span>{selectedTable.schema}</span>
              <span className="font-semibold">Table:</span>
              <span>{selectedTable.name}</span>
              <span className="font-semibold">Columns:</span>
              <span>{columnsData.data.length}</span>
              <span className="font-semibold">Target Path:</span>
              <span className="break-all">
                src/app/(secure)/{selectedModule.value}
                {selectedSubModule ? `/${selectedSubModule.value}` : ""}/
                {toKebabCase(selectedTable.name)}
              </span>
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full font-bold">
              {isGenerating ? "Generating..." : "Generate & Write to Codebase"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoadingTables && (
        <div className="flex justify-center p-4">
          <p className="animate-pulse text-muted-foreground">Loading tables...</p>
        </div>
      )}
    </div>
  );
}
