---
name: super-app-data-patterns
description: Data management with useStore, DataSources, lifecycle hooks, and CRUD operations. Use when creating stores, DataSources, implementing CRUD, dialogs, store hooks, or working with DataSource lifecycle hooks (beforeInsert, afterInsert, etc).
---

# Super-App Data Patterns

Comprehensive patterns for DataSource definitions, store configuration, CRUD operations, and lifecycle hooks.

## DataSource Lifecycle Hooks (Core Pattern)

**DataSources now support full lifecycle hooks** (`beforeInsert`, `afterInsert`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`, `preQuery`, `postQuery`).

Use these **instead of custom middleware or separate server files**:

### Validation Hooks

```typescript
import { UserError } from "@wayvo-ai/core/common";

export const EntityDataSource: DataSource<Entity> = {
  // Validate before insert
  beforeInsert: async ({ rows, session, client }) => {
    for (const row of rows) {
      if (!row.name?.trim()) {
        throw new UserError('Name is required');
      }
      // Normalize data
      row.name = row.name.trim();
    }
    return { rows };
  },

  // Validate before update
  beforeUpdate: async ({ rows, session, client }) => {
    for (const row of rows) {
      if (row.status === 'published' && !row.publishedAt) {
        row.publishedAt = new Date().toISOString();
      }
    }
    return { rows };
  },

  // Validate before delete with friendly error
  beforeDelete: async ({ rows, previousRows, session, client }) => {
    for (const row of previousRows ?? []) {
      if (row.isProtected) {
        throw new UserError('Cannot delete protected records');
      }
      // Check for child records (ON DELETE RESTRICT)
      const result = await client.query(
        'SELECT COUNT(*) as count FROM child_table WHERE parent_id = $1',
        [row.id]
      );
      if (Number(result.rows[0]?.count ?? 0) > 0) {
        throw new UserError(`${result.rows[0]?.count} child records still reference this. Remove them first.`);
      }
    }
    return rows;
  },
};
```

### Side Effect Hooks

```typescript
// Post-insert: notifications, cascade operations
afterInsert: async ({ rows, session, client }) => {
  for (const row of rows) {
    // Send notification
    await notificationService.send({
      userId: row.ownerId,
      message: `New ${row.type} created: ${row.name}`,
    });
  }
  return rows;
},

// Post-update: sync to external systems
afterUpdate: async ({ rows, session, client }) => {
  for (const row of rows) {
    if (row.status === 'published') {
      await webhook.notify('entity.published', row);
    }
  }
  return rows;
},

// Post-delete: cascade cleanup
afterDelete: async ({ rows, session, client }) => {
  for (const row of rows) {
    await client.query('DELETE FROM child_table WHERE parent_id = $1', [row.id]);
  }
  return rows;
},
```

### Query Transformation

```typescript
// Modify queries before execution (scoping)
preQuery: async ({ query, session, client }) => {
  // Admin sees all; users see only their own
  if (!session.user.isAdmin) {
    query.filters = [
      ...(query.filters || []),
      { ownerId: { is: session.user.id } }
    ];
  }
  return query;
},

// Transform results after query
postQuery: async ({ rows, session, client }) => {
  return rows.map(row => ({
    ...row,
    displayName: `${row.firstName} ${row.lastName}`,
  }));
},
```

## Store Identity & Configuration

### Store Key = `${alias}-${datasourceId}-${page}`

Stores with the same key are **shared across the app**:

```typescript
// These return THE SAME instance (crucial for sharing state)
const store1 = useStore({ datasourceId: 'Users', page: 'users-page', alias: 'users-list' });
const store2 = useStore({ datasourceId: 'Users', page: 'users-page', alias: 'users-list' });
// store1 === store2 ✅

// Different alias = different instance
const listStore = useStore({ datasourceId: 'Users', alias: 'users-list' });
const dialogStore = useStore({ datasourceId: 'Users', alias: 'users-dialog' });
```

### Store Configuration Patterns

```typescript
// List page - auto-load, pagination
export function useEntityListStore() {
  return useStore<Entity>({
    datasourceId: 'Entity',
    page: 'entity-page',
    alias: 'entity-list',
    limit: 20,
    includeCount: true,
    autoQuery: true,
    sort: { createdAt: -1 },
  });
}

// Dialog - manual load, single record
export function useEntityDialogStore() {
  return useStore<Entity>({
    datasourceId: 'Entity',
    page: 'entity-page',
    alias: 'entity-dialog',  // ⚠️ Different alias!
    limit: 1,
    autoQuery: false,
  });
}

// Lookup/Combobox - small set, manual load
export function useUserLookupStore() {
  return useStore<Users>({
    datasourceId: 'Users',
    alias: 'user-combobox',
    limit: 50,
    autoQuery: false,
    select: ['userName', 'displayName'],
  });
}

// Filtered by default
export function useActiveProjectsStore() {
  return useStore<Projects>({
    datasourceId: 'Projects',
    alias: 'active-projects',
    limit: 500,
    autoQuery: true,
    match: { isArchived: false },  // Simple equality
    filters: [{ status: { in: ['Active', 'In_Progress'] } }],  // Complex
    sort: { name: 1 },
  });
}
```

## Essential Hooks

**Use these in render; never use `store.rows()` or `store.currentRow` directly.**

| Hook | Use | Return |
|------|-----|--------|
| `useCurrentRowSync` | ✅ Forms (prevents cursor jump) | `Row<T> \| undefined` |
| `useDBRows` | ✅ Lists (all from DB) | `ReadonlyArray<DBRow<T>>` |
| `useRows` | ✅ Editable grids (includes new) | `ReadonlyArray<Row<T>>` |
| `useRowValue` | ✅ Single field | `T[K] \| undefined` |
| `useIsStoreLoading` | ✅ Loading state | `boolean` |
| `useIsStorePosting` | ✅ Saving state | `boolean` |
| `useIsStoreDirty` | ✅ Unsaved changes | `boolean` |

```typescript
// ❌ Wrong - non-reactive during render
const rows = store.rows();
const row = store.currentRow;
const isLoading = store.isLoading();

// ✅ Correct - reactive hooks
const rows = useDBRows(store);
const row = useCurrentRowSync(store);
const isLoading = useIsStoreLoading(store);
```

## Form Pattern (Complete)

```typescript
'use client';

import { useCurrentRowSync, useIsStoreDirty, useIsStorePosting } from '@/lib/common/store';
import { TextInput, Button, Popup } from '@/components/ui/...';
import type { Entity } from '@/lib/common/ds/types/module/Entity';
import type { Store } from '@/lib/common/store';

function EntityForm({ store }: { store: Store<Entity> }) {
  const row = useCurrentRowSync(store);  // ✅ Sync mode for forms
  const isDirty = useIsStoreDirty(store);
  const isPosting = useIsStorePosting(store);

  if (!row) return null;

  return (
    <>
      <TextInput 
        label="Name" 
        store={store} 
        attributeCode="name" 
        required 
      />
      <TextInput 
        label="Description" 
        store={store} 
        attributeCode="description" 
      />
      <Button disabled={isPosting || !isDirty}>Save</Button>
    </>
  );
}
```

## Dialog Pattern (Complete)

```typescript
'use client';

import { useCallback, useState } from 'react';
import { Popup, Button } from '@/components/ui/...';
import { useCurrentRowSync, useIsStoreDirty, useIsStorePosting } from '@/lib/common/store';
import type { Entity } from '@/lib/common/ds/types/module/Entity';
import type { Store } from '@/lib/common/store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store<Entity>;
  editingRow?: Entity | null;
}

export function EntityDialog({ open, onOpenChange, store, editingRow }: Props) {
  const row = useCurrentRowSync(store);
  const isDirty = useIsStoreDirty(store);
  const isPosting = useIsStorePosting(store);

  const handleSave = async () => {
    await store.save({ feedback: 'Saved' });
    onOpenChange(false);
  };

  const handleClose = () => {
    store.resetStore();  // Discard unsaved changes
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Popup
      title={editingRow ? 'Edit Entity' : 'Add Entity'}
      onClose={handleClose}
      width={520}
      height={430}
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isPosting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPosting || !isDirty || !row}>
            Save
          </Button>
        </>
      }
    >
      {row && <EntityForm store={store} />}
    </Popup>
  );
}

// Usage in parent
function ParentComponent() {
  const store = useEntityDialogStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Entity | null>(null);

  // ✅ Initialize BEFORE opening (not in useEffect)
  const handleAdd = useCallback(() => {
    store.createNew({ partialRecord: { status: 'draft' } });
    setEditingRow(null);
    setIsDialogOpen(true);
  }, [store]);

  const handleEdit = useCallback((row: Entity) => {
    store.setCurrentRow(row);
    setEditingRow(row);
    setIsDialogOpen(true);
  }, [store]);

  return (
    <>
      <Button onClick={handleAdd}>Add</Button>
      <EntityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        store={store}
        editingRow={editingRow}
      />
    </>
  );
}
```

## CRUD Operations

```typescript
import { generateUUID } from '@wayvo-ai/core/common';

// CREATE - initialize BEFORE opening dialog
const handleAdd = useCallback(() => {
  store.createNew({
    partialRecord: { id: generateUUID(), status: 'draft' }
  });
  setOpen(true);
}, [store]);

// READ - via useDBRows hook
const rows = useDBRows(store);
const row = useCurrentRowSync(store);

// UPDATE - single field or whole row
store.setValue('name', 'New Name');
store.updateRow(rowId, { name: 'New Name', status: 'active' });

// SAVE (auto-refreshes; no manual refresh needed)
await store.save({ feedback: 'Saved' });
await store.save({ feedback: 'NONE' });  // Silent

// DELETE with confirmation
import { confirmWithUser } from '@/components/ui/...';

const handleDelete = useCallback(async (entity: Entity) => {
  const confirmed = await confirmWithUser({
    title: 'Delete?',
    content: `Delete "${entity.name}"? Cannot undo.`,
  });
  if (confirmed) {
    await store.deleteRow(entity.id);
    await store.save({ feedback: 'Deleted' });
  }
}, [store]);

// CANCEL - discard changes
store.resetStore();
```

## Anti-Patterns to Avoid

```typescript
// ❌ Store methods during render (non-reactive)
const rows = store.rows();
const isLoading = store.isLoading();

// ✅ Use hooks
const rows = useDBRows(store);
const isLoading = useIsStoreLoading(store);

// ❌ Refresh after save (same store)
await store.save();
await store.executeQuery();  // Unnecessary!

// ✅ Just save (auto-refreshes)
await store.save();

// ❌ useCurrentRow for forms (cursor jumps)
const row = useCurrentRow(store);

// ✅ useCurrentRowSync for forms
const row = useCurrentRowSync(store);

// ❌ Init dialog in useEffect
useEffect(() => { if (open) store.createNew(); }, [open]);

// ✅ Init in event handler
const handleAdd = () => { store.createNew(); setOpen(true); };

// ❌ Same store with different configs
useStore({ datasourceId: 'U', alias: 'list', limit: 20 });
useStore({ datasourceId: 'U', alias: 'list', limit: 50 });  // limit ignored!

// ✅ Different alias
useStore({ datasourceId: 'U', alias: 'users-list', limit: 20 });
useStore({ datasourceId: 'U', alias: 'users-export', limit: 50 });
```

## Sort Priority

```typescript
sort: {
  createdAt: -1,  // Primary: descending
  name: 2,        // Secondary: ascending
  status: -3,     // Tertiary: descending
}
```

Positive = asc, Negative = desc. Absolute value = priority (1=first, 2=second, etc).

## References

- **DataSource Lifecycle Hooks**: See `.cursor/rules/datasource-pattern.mdc`
- **Full Store Reference**: See `store-reference.md` in this skill
- **DataSource Reference**: See `datasource-reference.md` in this skill
