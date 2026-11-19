# Decisions

Decisions a reviewer might question. One entry each: date, decision, reason, how to reverse.

## 2026-11-11

- **Project files live at the repository root.** The clone `kiroween/` contained a nested `revenant/` folder. I moved its contents up to the clone root. Reason: `structure.md` treats `.` as the root, and Gate 0 needs `LICENSE` at the root of the public repo. Reverse: move the files back into a `revenant/` folder. An empty `revenant/` directory remains because the IDE holds a lock on it; delete it when the lock is released. It is excluded from ESLint and Prettier.
- **Node is pinned per project with `.nvmrc` (24.14.0), not globally.** Reason: the user asked not to change the system default (`nvm default` is still 24.11.0). Reverse: delete `.nvmrc`.
- **pnpm 10.18.3 through corepack, set by the `packageManager` field.** `npm install -g pnpm` failed (existing `pnpx` shim, EEXIST). `corepack enable` was refused (EPERM on `D:\softwares\node`), so no global change was made. The existing corepack shim in `%APPDATA%\npm` resolves the version from `packageManager`. Reverse: remove `packageManager` and install pnpm another way.
- **TypeScript pinned to `~5.9`.** `tech.md` says TypeScript 5. The latest release (7.x) is outside the peer range of `typescript-eslint` 8.73. Reverse: `pnpm add -Dw typescript@latest` once typescript-eslint supports it.
- **`moduleResolution: Bundler`, workspace packages export TS source (`"main": "./src/index.ts"`).** Reason: Vite, Vitest and tsx all consume TS directly, and relative imports need no `.js` suffix. Reverse: switch to `NodeNext` and add a build step per package.
- **Dev dependencies added in Phase 0 (not named in the design):** `eslint`, `@eslint/js`, `typescript-eslint`, `globals` (lint), `prettier`, `tsx` (runs `pnpm revenant` from source), `@types/node`. Reason: the root scripts in `tech.md` need them.
- **`esbuild` is in `onlyBuiltDependencies`** in `pnpm-workspace.yaml`. Reason: pnpm 10 skips build scripts by default, and `tsx`/Vitest need the esbuild binary.
- **`format:check` is not part of `pnpm verify`.** The starter files (README, docs, hook scripts) are not Prettier-formatted, and mass-reformatting them was out of scope. The `format-on-save` hook formats files as they are saved. Reverse: run `pnpm format` once and add `format:check` to `verify`.
- **`.prettierignore` excludes `.kiro/`.** Reason: spec and steering files are authored markdown that Prettier would reflow.
- **Smoke module `packages/core/src/reverse-list.ts`.** Reason: Phase 0 step 2 requires one trivial property test so `pnpm test:prop` runs something. Reverse: delete it once Phase 1 adds real properties.
