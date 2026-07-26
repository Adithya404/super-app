---
name: super-app-verify-changes
description: Auto-fix and verify Biome lint, formatting, and TypeScript errors in this repo. Use after writing or editing any .ts/.tsx file, after running shadcn or ai-elements CLI commands that create or overwrite components, and when biome or tsc reports errors such as useImportType, useSortedClasses, organizeImports, noUnusedImports, noConsole, or noArrayIndexKey.
---

# Verify Changes

Generated code must leave `pnpm check` and `pnpm typecheck` passing. Do not hand-fix
style violations — let Biome fix them, then read the remaining errors.

## Required loop

After editing or creating any `.ts` / `.tsx` file:

```bash
pnpm exec biome check --write <changed paths>
pnpm typecheck
```

Before reporting the task complete, run repo-wide:

```bash
pnpm check
pnpm typecheck
```

Both must exit 0. If `check` still reports errors after `--write`, they are unsafe
fixes needing a real code change — fix the code, do not suppress.

## `pnpm lint` is not enough

| Command | Covers |
|---|---|
| `pnpm lint` | linter rules only |
| `pnpm check` | linter **+ formatter + import sorting** |

`assist/source/organizeImports` and formatter violations pass `pnpm lint` and fail
`pnpm check`. Always verify with `pnpm check`.

## After shadcn / ai-elements CLI

The CLI writes upstream source that does not match this repo's Biome config, and it
overwrites existing files in `src/components/ui/`.

1. When prompted to overwrite an existing `src/components/ui/*` file, decline unless
   the new component genuinely needs it. Overwriting reverts local fixes.
2. Run `pnpm exec biome check --write` on every file the CLI reports as created or
   updated — including the `src/components/ui/*` files, not just the new component.
3. Then run `pnpm typecheck`; upstream components are written against a different AI
   SDK version and can reference fields that do not exist here.

## Rules that bite in this repo

| Rule | Requirement |
|---|---|
| `style/useImportType` | Type-only imports use `import type` (incl. `import type * as React`) |
| `nursery/useSortedClasses` (error) | Tailwind classes in `className` and `cn()` must be sorted — never hand-sort, let Biome write it |
| `correctness/noUnusedImports`, `noUnusedVariables` (error) | Delete imports and variables your edit orphaned |
| `suspicious/noConsole` (error) | Only `console.error`, `warn`, `info`, `assert` |
| `assist/source/organizeImports` | Import order is enforced; write imports in any order and let Biome sort |
| formatter | 100 col width, double quotes, semicolons, trailing commas |

Prefer a stable key over an array index in lists. Only use `// biome-ignore` with a
one-line reason on the same line above the offending expression.

## TypeScript pitfalls

- **AI SDK types change between versions.** Verify field names against
  `node_modules/ai/dist/index.d.ts` before using them. Token usage lives on nested
  objects (`usage.outputTokenDetails.reasoningTokens`), not flat properties.
- **Never import from an API route into a client component.** Importing
  `src/app/api/*/route.ts` pulls server code into the browser bundle. Put shared
  types and constants in a sibling `types.ts` and import that from both sides.
- **No `any`** unless unavoidable.

## Shell notes

The default shell is Windows PowerShell: `&&` is not a valid separator. Chain with
`;`, or issue separate commands.
