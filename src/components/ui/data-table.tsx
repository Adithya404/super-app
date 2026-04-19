/** biome-ignore-all lint/a11y/useSemanticElements: <ignore> */
/** biome-ignore-all lint/a11y/useAriaPropsForRole: <ignore> */
"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
  });

  return (
    <div className="flex h-full w-full flex-col px-2">
      <div className="min-h-0 flex-1 overflow-auto">
        {/*
          Key fixes:
          - `table-fixed` forces columns to respect their assigned widths
          - `w-full` ensures the table fills the container
          - Cells use `max-w-0` so that `overflow-hidden + truncate` works
            inside a `table-fixed` layout (without max-w-0 the cell ignores
            the width constraint and expands)
        */}
        <Table className="w-full table-fixed border-collapse">
          <TableHeader className="sticky top-0 z-10 border-b bg-card shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="group relative h-12 border-b py-0"
                  >
                    {/* Truncated header label */}
                    <div className="flex items-center justify-between overflow-hidden">
                      <span className="truncate">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                    </div>

                    {/* Resize handle */}
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      role="separator"
                      aria-orientation="vertical"
                      tabIndex={0}
                      className={`absolute top-0 right-0 flex h-full w-4 cursor-col-resize touch-none select-none items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${
                        header.column.getIsResizing() ? "opacity-100" : ""
                      }`}
                    >
                      <div
                        className={`absolute top-0 right-0 h-full w-px ${
                          header.column.getIsResizing() ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                      <GripVertical
                        size={14}
                        className={`z-10 ${
                          header.column.getIsResizing()
                            ? "text-blue-500"
                            : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      /*
                        `max-w-0` is the critical trick: in a `table-fixed` layout
                        it tells the browser this cell must NOT grow beyond its
                        assigned width, enabling `truncate` (overflow:hidden +
                        text-overflow:ellipsis + whitespace:nowrap) to work.
                      */
                      className="max-w-0 py-3"
                    >
                      <div
                        className="truncate"
                        title={
                          // Show full value in a native tooltip on hover
                          typeof cell.getValue() === "string" || typeof cell.getValue() === "number"
                            ? String(cell.getValue())
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-full py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <span className="font-medium text-lg">No results found</span>
                    <p className="text-sm">There are no entries to display at this time.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 border-t bg-card/50 px-4 py-3">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} row(s) total.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
