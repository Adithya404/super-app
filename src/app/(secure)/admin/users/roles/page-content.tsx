"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import RolesEditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();

  return (
    <PageLayoutTemplate
      title="Roles"
      description="Manage Roles data."
      getColumns={getColumns}
      store={store}
      editForm={<RolesEditForm />}
    />
  );
}
