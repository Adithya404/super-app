"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsStoreLoading } from "@/lib/common/store/store-hooks";
import type { Store } from "@/lib/common/store/types";
import { useRows } from "@/lib/common/store/use-rows";

// Note: TData should extend object for Store<TData>
interface PageLayoutTemplateProps<TData extends object, TValue> {
  columns?: ColumnDef<TData, TValue>[];
  getColumns?: (handlers: { onEdit: (row: TData) => void }) => ColumnDef<TData, TValue>[];
  store: Store<TData>;
  title: string;
  description: string;
  editForm?: React.ReactNode;
  toolbar?: React.ReactNode;
}

function TableLoadingSkeleton({
  columnCount,
  rowCount = 8,
}: {
  columnCount: number;
  rowCount?: number;
}) {
  const headerKeys = useMemo(
    () =>
      Array.from({ length: columnCount }, (_, index) => `skeleton-header-${columnCount}-${index}`),
    [columnCount],
  );
  const rowKeys = useMemo(
    () => Array.from({ length: rowCount }, (_, index) => `skeleton-row-${rowCount}-${index}`),
    [rowCount],
  );
  const cellKeysByRow = useMemo(
    () =>
      rowKeys.map((rowKey) =>
        Array.from({ length: columnCount }, (_, index) => `${rowKey}-cell-${columnCount}-${index}`),
      ),
    [rowKeys, columnCount],
  );

  return (
    <div className="flex h-full w-full flex-col px-2">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headerKeys.map((key) => (
                <TableHead key={key}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rowKeys.map((rowKey, rowIndex) => (
              <TableRow key={rowKey}>
                {cellKeysByRow[rowIndex]?.map((cellKey, colIndex) => (
                  <TableCell key={cellKey}>
                    <Skeleton
                      className="h-4"
                      style={{
                        width: `${Math.min(60 + ((rowIndex + colIndex) % 4) * 20, 100)}%`,
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function PageLayoutTemplate<TData extends object, TValue>({
  columns: staticColumns,
  getColumns,
  store,
  title,
  description,
  editForm,
  toolbar,
}: PageLayoutTemplateProps<TData, TValue>) {
  const data = useRows(store);
  const isLoading = useIsStoreLoading(store);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  const handleEdit = (row: TData) => {
    if (store?.beginEdit) {
      store.beginEdit(row);
    }
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const resolvedColumns = getColumns?.({ onEdit: handleEdit }) ?? staticColumns ?? [];

  const handleAddNew = () => {
    if (store?.createNew) {
      store.createNew();
    }
    setDialogMode("add");
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (store?.save) {
      const success = await store.save();
      if (success !== false) {
        setIsDialogOpen(false);
      }
    } else {
      setIsDialogOpen(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      store.resetStore?.();
    }
    setIsDialogOpen(open);
  };

  const editFormWithStore = React.isValidElement(editForm)
    ? React.cloneElement(editForm as React.ReactElement<{ store: Store<TData> }>, { store })
    : editForm;

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

          <div className="flex items-center gap-3">
            {toolbar}

            {editForm && (
              <Button onClick={handleAddNew} size="sm" className="gap-1.5">
                <PlusIcon className="h-4 w-4" />
                Add New
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Table area */}
      <main className="min-h-0 flex-1 overflow-hidden bg-background">
        {isLoading ? (
          <TableLoadingSkeleton columnCount={Math.max(resolvedColumns.length, 4)} />
        ) : (
          <DataTable columns={resolvedColumns} data={data} isLoading={isLoading} />
        )}
      </main>

      {/* Edit Form Dialog */}
      {editForm && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-md md:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "add" ? `Add New ${title}` : `Edit ${title}`}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-1 py-4">{editFormWithStore}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PageLayoutTemplate;
