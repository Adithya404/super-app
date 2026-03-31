"use client";
import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { columns, type Roles } from "./columns";

export default function DemoPage() {
  const [data, setData] = useState<Roles[]>([]);

  useEffect(() => {
    async function getData() {
      try {
        const res = await fetch("/api/admin/roles");

        if (!res.ok) {
          throw new Error("Failed to fetch roles");
        }

        const json = await res.json();

        // Extract actual data
        setData(json.data);
      } catch (error) {
        console.error(error);
      }
    }

    getData();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
