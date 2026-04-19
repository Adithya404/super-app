"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { useRows } from "@/lib/common/store/use-rows";

interface PageLayoutTemplateProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  store: { data: TData[] };
  title: string;
  description: string;
}

export function PageLayoutTemplate<TData, TValue>({
  columns,
  store,
  title,
  description,
}: PageLayoutTemplateProps<TData, TValue>) {
  const data = useRows(store);

  return (
    <div
      className="fade-in flex h-full w-full animate-in flex-col overflow-hidden duration-500"
      style={{ fontFamily: "'DM Sans', 'Geist', sans-serif" }}
    >
      {/* Header */}
      <header className="relative shrink-0 overflow-hidden border-border/60 border-b">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 bg-linear-to-br from-background via-muted/30 to-background"
          aria-hidden
        />
        {/* Accent line on the left */}
        <div
          className="absolute top-0 left-0 h-full w-0.5 bg-linear-to-b from-primary/80 via-primary/40 to-transparent"
          aria-hidden
        />

        <div className="relative flex items-end justify-between gap-4 px-4 py-3">
          <div className="flex flex-col gap-1">
            <h1
              className="font-semibold text-2xl text-foreground leading-none tracking-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              {title}
            </h1>
            <p className="text-muted-foreground/80 text-sm leading-snug">{description}</p>
          </div>

          {/* Decorative row-count pill — populated by DataTable internally,
              but we can show a static badge for now */}
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 font-medium text-muted-foreground text-xs backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden />
            {data.length} {data.length === 1 ? "row" : "rows"}
          </div>
        </div>
      </header>

      {/* Table area */}
      <main className="min-h-0 flex-1 overflow-hidden bg-background">
        <DataTable columns={columns} data={data} />
      </main>
    </div>
  );
}

export default PageLayoutTemplate;
