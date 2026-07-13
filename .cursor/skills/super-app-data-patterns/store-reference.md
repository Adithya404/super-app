# Store Reference

## Props (`StoreOptions`)

| Prop | Default | Description |
|------|---------|-------------|
| `datasourceId` | required | DataSource id |
| `page` | `default` | Page part of store key |
| `alias` | `default` | Instance part of store key |
| `limit` | `100` | Page size |
| `autoQuery` | `true` unless `false` | Fetch on mount |
| `includeCount` | — | Total count for pagination |
| `defaultFilters` | — | Always-merged filters |
| `defaultMatch` | — | Always-merged equality match |
| `sort` | — | Default sort |
| `filters` | — | User filters |

## Alias Convention

| Pattern | Example |
|---------|---------|
| `{module}-list` / `-all` | `users-all` |
| `{module}-edit` | `user-edit` |
| `{module}-dialog` | `user-dialog` |
| `{module}-combobox` | `user-combobox` |

## Hooks

| Hook | Returns |
|------|---------|
| `useStore(options)` | Shared `Store<T>` |
| `useCurrentRowSync(store)` | Current row (forms) |
| `useCurrentRow(store)` | Current row (display) |
| `useDBRows(store)` | DB rows |
| `useRows(store)` | Local + DB rows |
| `useRowValue(store, id, key)` | Field value |
| `useIsStoreLoading` / `Posting` / `Dirty` / `Busy` | Booleans |
| `useStoreRowCount` | Count |
| `useStoreError` | Error string |

## Methods

```typescript
await store.executeQuery({ query: { match: { id }, filters: [...] } });
await store.refresh();
store.createNew({ partialRecord: {} });
store.beginEdit(row);
store.setCurrentRow(row);
store.setValue("field", value);
store.updateRow(id, partial);
await store.deleteRow(id);
await store.save({ feedback: "Saved" | "NONE" });
store.resetStore();
```

## Dialog Checklist

1. Separate dialog alias if needed (or share list store for same-store pattern)
2. `createNew` / `beginEdit` in click handler **before** `setOpen(true)`
3. Form uses `useCurrentRowSync` + `setValue`
4. Save disabled when `!isDirty || isPosting`
5. Cancel calls `resetStore()`
