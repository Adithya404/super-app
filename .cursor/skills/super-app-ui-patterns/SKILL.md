---
name: super-app-ui-patterns
description: UI patterns for forms, tables, dialogs, and Tailwind layouts. Use when building edit forms, table columns, PageLayoutTemplate dialogs, or scrollable panels.
---

# Super-App UI Patterns

## Forms + Store

- Always `useCurrentRowSync(store)` for editable fields
- Prefer `store.setValue(field, value)` over manual `updateRow` when editing current row
- Disable Save when `!useIsStoreDirty(store) || useIsStorePosting(store)`
- Cancel → `store.resetStore()`

```typescript
const row = useCurrentRowSync(store);
const isDirty = useIsStoreDirty(store);
const isPosting = useIsStorePosting(store);

<Input
  value={row?.name ?? ""}
  onChange={(e) => store.setValue("name", e.target.value)}
/>
```

## Dialog Lifecycle

```typescript
const handleAdd = () => {
  store.createNew({ partialRecord: { /* defaults */ } });
  setOpen(true);
};

const handleEdit = (row: Entity) => {
  store.beginEdit(row);
  setOpen(true);
};

const handleClose = () => {
  store.resetStore();
  setOpen(false);
};
```

`PageLayoutTemplate` already follows this for Add/Edit.

## Tables

- `getColumns({ onEdit })` for action wiring
- Keep cells small; extract `ActionsCell` for menus
- Date cells: follow `date-handling` rule

## Layout

- One job per section
- Use Tailwind; `cn()` from `@/lib/utils` for conditional classes
- Prefer existing Shadcn primitives in `@/components/ui`

## Scrollable Regions

Add thin scrollbar utilities when using `overflow-auto` / `overflow-y-auto` if the project scrollbar plugin is configured; otherwise keep overflow clean and avoid nested scroll traps.
