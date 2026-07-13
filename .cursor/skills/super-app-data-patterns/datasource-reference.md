# DataSource Reference

## Locations

- Definitions: `src/lib/common/ds/definitions/`
- Types: `src/lib/common/ds/types/`
- Registry: `src/lib/common/ds/registry.ts`
- Defaults: `src/lib/common/ds/defaults.ts`
- API: `src/app/api/ds/[datasourceId]/route.ts`

## New DataSource Checklist

1. Create interface in `types/...`
2. Create `*DS.ts` with attributes + access
3. Export from module index and register in `registry.ts`
4. Add `hooks/use-store.ts` on the page
5. Wire `PageLayoutTemplate` or custom UI

## Attribute Rules

- `code`: camelCase (matches TS field)
- `column`: snake_case (DB)
- Mark `primary: true` on PK
- Set `optional: false` for required fields

## Access

Use defaults from `defaults.ts` (`DefaultFullAccess`, `DefaultReadOnlyAccess`) and set `roleCode`.
