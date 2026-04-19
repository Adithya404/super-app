"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import { columns } from "./hooks/table-columns";
import { useMigrationsStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useMigrationsStore();

  return (
    <PageLayoutTemplate
      title="Migrations"
      description="Manage Migrations data."
      columns={columns}
      store={store}
    />
  );
}
