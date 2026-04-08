"use client";
import { useQuery } from "@tanstack/react-query";
// import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import { useDeleteSession } from "./hooks/use-delete-session";

export default function DemoPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetch("/api/admin/user-sessions").then((r) => r.json()),
  });
  const deleteMutation = useDeleteSession();
  const columns = getColumns((id: string) => {
    deleteMutation.mutate(id);
  });
  if (isPending) return <span>Loading...</span>;
  if (error) return <span>Oops!</span>;

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.data} />
    </div>
  );
}
