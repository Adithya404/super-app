"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import UsersEditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();

  return (
    <PageLayoutTemplate
      title="Users"
      description="Manage Users data."
      getColumns={getColumns}
      store={store}
      editForm={<UsersEditForm />}
    />
  );
}
