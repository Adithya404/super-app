"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Store } from "@/lib/common/store/types";
import { useRows } from "@/lib/common/store/use-rows";

// Note: TData should extend object for Store<TData>
interface PageLayoutTemplateProps<TData extends object, TValue> {
  columns: ColumnDef<TData, TValue>[];
  store: Store<TData>;
  title: string;
  description: string;
  editForm?: React.ReactNode;
}

export function PageLayoutTemplate<TData extends object, TValue>({
  columns,
  store,
  title,
  description,
  editForm,
}: PageLayoutTemplateProps<TData, TValue>) {
  const data = useRows(store);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddNew = () => {
    if (store?.createNew) {
      store.createNew();
    }
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
            {/* Decorative row-count pill */}
            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 font-medium text-muted-foreground text-xs backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden />
              {data.length} {data.length === 1 ? "row" : "rows"}
            </div>

            {/* Add New Button */}
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
        <DataTable columns={columns} data={data} />
      </main>

      {/* Edit Form Dialog */}
      {editForm && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md md:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New {title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-1 py-4">{editFormWithStore}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
