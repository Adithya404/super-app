---
name: super-app-data-patterns
description: Data management with useStore, DataSources, and CRUD. Use when creating stores, DataSources, implementing CRUD, dialogs, or store hooks.
---

# Super-App Data Patterns

Local store: `@/lib/common/store`. Inspired by Wayvo core store patterns.

## Store Identity

Key = `${alias}-${datasourceId}-${page}`. Same key shares one instance app-wide.

## Configuration

```typescript
import { useStore } from "@/lib/common/store";

export function useEntityListStore() {
  return useStore<Entity>({
    datasourceId: "Entity",
    page: "entity-page",
    alias: "entity-list",
    limit: 20,
    includeCount: true,
    autoQuery: true,
  });
}

export function useEntityDialogStore() {
  return useStore<Entity>({
    datasourceId: "Entity",
    page: "entity-page",
    alias: "entity-dialog",
    limit: 1,
    autoQuery: false,
  });
}
```

## Essential Hooks

| Hook | Purpose |
|------|---------|
| `useCurrentRowSync` | Forms (sync mode) |
| `useDBRows` / `useRows` | Lists |
| `useRowValue` | Field from row |
| `useIsStoreLoading` / `useIsStorePosting` / `useIsStoreDirty` | UI flags |

## Form Pattern

```typescript
import { useCurrentRowSync, useIsStoreDirty, useIsStorePosting } from "@/lib/common/store";

function EntityForm({ store }: { store: Store<Entity> }) {
  const row = useCurrentRowSync(store);
  const isDirty = useIsStoreDirty(store);
  const isPosting = useIsStorePosting(store);
  if (!row) return null;

  return (
    <>
      <Input value={row.name ?? ""} onChange={(e) => store.setValue("name", e.target.value)} />
      <Button disabled={isPosting || !isDirty}>Save</Button>
    </>
  );
}
```

## CRUD

```typescript
// Create — BEFORE open
store.createNew({ partialRecord: { status: "draft" } });
setOpen(true);

// Edit
store.beginEdit(row);
setOpen(true);

store.setValue("name", "New");
await store.save({ feedback: "Saved" });

await store.deleteRow(id);
await store.save({ feedback: "Deleted" });

store.resetStore(); // cancel
```

## Anti-Patterns

```typescript
// ❌ Non-reactive render
const rows = store.list();

// ✅
const rows = useDBRows(store);

// ❌ Init in useEffect on dialog open
useEffect(() => { if (open) store.createNew(); }, [open]);

// ✅ Init in handler
const handleAdd = () => { store.createNew(); setOpen(true); };

// ❌ Refresh after save (same store)
await store.save();
await store.refresh();

// ✅
await store.save({ feedback: "Saved" });
```

## DataSource

See [datasource-reference.md](datasource-reference.md) and rule `datasource-pattern.mdc`.

## Full Store API

See [store-reference.md](store-reference.md).
