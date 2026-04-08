"use client";
import { useQuery } from "@tanstack/react-query";
// import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

export default function DemoPage() {
  const { data, isPending, error } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () => fetch("/api/admin/user-roles").then((r) => r.json()),
  });
  if (isPending) return <span>Loading...</span>;
  if (error) return <span>Oops!</span>;

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.data} />
    </div>
  );
}
