---
name: super-app-nextjs-patterns
description: Create Next.js pages with PageLayoutTemplate and store-backed lists. Use when creating pages, page-content, admin CRUD screens, or feature folders under src/app.
---

# Super-App Next.js Patterns

## Folder Layout

```
src/app/(secure)/module/feature/
├── page.tsx
├── page-content.tsx
├── hooks/
│   ├── use-store.ts
│   └── table-columns.tsx
└── components/
    ├── edit-form.tsx
    └── actions-cell.tsx
```

## Entry + Content

```typescript
// page.tsx
import PageContent from "./page-content";
export default function Page() {
  return <PageContent />;
}

// page-content.tsx
"use client";
import { PageLayoutTemplate } from "@/components/layout/common/PageLayoutTemplate";
import EditForm from "./components/edit-form";
import { getColumns } from "./hooks/table-columns";
import { useStore } from "./hooks/use-store";

export default function PageContent() {
  const store = useStore();
  return (
    <PageLayoutTemplate
      title="Feature"
      description="Manage feature data"
      store={store}
      getColumns={getColumns}
      editForm={<EditForm />}
    />
  );
}
```

## Store Hook

```typescript
import { useStore as useBaseStore } from "@/lib/common/store";

export function useStore() {
  return useBaseStore({
    datasourceId: "Entity",
    page: "entity-page",
    alias: "entity-all",
    limit: 100,
    includeCount: true,
    autoQuery: true,
  });
}
```

## When Not to Use PageLayoutTemplate

Custom master/detail, multi-tab, or non-table UIs — still use `useStore` + hooks; compose layout manually. See rule `page-pattern.mdc`.

## API Routes

Prefer DataSource `/api/ds/[datasourceId]` for CRUD. Add `route.ts` only for webhooks, streaming, or public endpoints.
