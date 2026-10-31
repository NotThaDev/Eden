---
name: frontend
description: >-
  Implement Eden frontend features: Angular 21 standalone components, feature
  folders, signal-based services, HttpHandler, core models, Angular Material
  dialogs/tables, and shared components. Use when adding or changing pages,
  components, dialogs, drawers, tables, forms, services, models, or routes
  under frontend/. When the user asks for a frontend structure change, update
  this skill so it matches the new structure.
---

# Frontend

Eden UI is an Angular 21 app (standalone components, SSR, Angular Material, TailwindCSS) in `frontend/`. The package manager is **bun**, never npm. Domain types live in `core/models`, HTTP goes through `HttpHandler`, feature state lives in signal-based services. Components render.

## Keep this skill current

When the user asks for a change to frontend structure, update this file in the same change. Structure means folders, how components are split, the service or model shape, shared UI conventions, or routing.

A new screen that follows the rules already written here does not need a skill edit. If the requested change replaces a rule, rewrite that section so it describes the new structure and drop the old one. Keep `.github/copilot-instructions.md` in sync when a rule it also states changes.

## Documentation

When you add or change a complex feature, write or update a markdown note for it in `docs/` at the repo root, in the same change. Complex means a multi-step flow or behavior that is hard to see from the code alone. A simple screen that lists or edits one entity does not need a note. Link a new note from `README.md`, and update `README.md` when a user-facing area is added or changes.

## Running

- Everything: `process-compose up` from the repo root.
- UI only: `cd frontend && bun start` (http://localhost:4200, API expected on http://localhost:5190).
- Build: `cd frontend && bun run build`. Tests: `cd frontend && bun run test` (Vitest).
- Install: `bun install` (process-compose uses `bun ci`). Do not create `package-lock.json`.

## Folder map

```
frontend/src/app/
  app.routes.ts               # EdenAppRoutes: nav entries (title, icon, hide)
  core/
    http/httpHandler.ts       # get, post, put, patch, delete; prefixes the API URL
    models/<domain>.ts        # interfaces matching the API
  features/<area>/            # e.g. boc/
    services/<domain>.service.ts
    <feature>/                # route component + UI only that feature uses
      <feature>.ts/.html/.scss
      <region>/               # dialog, drawer content, table
      utils.ts                # helpers used only in this feature
  shared/
    components/               # widgets used by more than one feature
    DateFormat.ts
```

Feature UI stays under its feature folder (`features/boc/storage/new-load-dialog/`). Move a component to `shared/components/` only when a second feature needs it. A page that should appear in the nav gets an entry in `app.routes.ts` with an Italian `title`.

## Components

- Files are `kebab-case` with no `.component` suffix: `update-food-dialog.ts`, `.html`, `.scss`. The class is PascalCase without a suffix (`UpdateFoodDialog`); the selector is `app-<kebab-name>`.
- Standalone only: list dependencies in `imports`, no NgModules.
- Use `inject()` for dependencies, signals and `computed()` for state, `effect()` to push service signals into a `MatTableDataSource`.
- Forms use `ReactiveFormsModule` with `FormBuilder` and `Validators`.
- Dialogs use `MatDialog.open(...)`; the dialog reads `MAT_DIALOG_DATA` and closes with the form value. The parent calls the service in `afterClosed()`.
- Destructive actions confirm with the shared `ConfirmationDialog` first.
- Feedback uses `MatSnackBar.openFromComponent(Snackbar, { data: { title, status: SnackbarStatus.X } })`.
- All user-visible text is **Italian**. Code, comments, and identifiers are English.

## Services and models

One service per domain in `features/<area>/services/` (`food.service.ts`), `@Injectable({ providedIn: 'root' })`:

- Private writable signals (`foodsSignal`, `loadingSignal`) exposed with `.asReadonly()`.
- `fetchX()` subscribes and sets the signal. Mutations (`createX`, `updateX`, `deleteX`) return the observable with `tap` to update the signal and `finalize` to reset loading; the component subscribes and shows the snackbar.
- Endpoint paths (`'api/food'`) stay in the service.

One interface file per domain in `core/models/` (`food.ts`), with `id?: number` and fields named like the API JSON (camelCase).

Never use `HttpClient` directly; inject `HttpHandler`. Components do not build endpoint strings.

## UI to reuse

Use these before adding a new primitive:

- Angular Material (`MatTableModule`, `MatButtonModule`, `MatIcon`, `MatDialog`, form fields, datepicker with the Luxon adapter)
- `PageHeader` — page title and actions
- `Drawer` — side panel; feature-specific content goes in a `*-drawer-content` component
- `Accordion`, `EmptyState` (optional `icon`), `LabelChip`, `NecessityLevelSelect` (multi-select of assistance levels shown as chips, form control of `AssistanceLevel[]`)
- `ConfirmationDialog` — destructive confirm
- `Snackbar` + `SnackbarStatus`
- `MONTH_DAY_YEAR_FORMAT` from `shared/DateFormat.ts`
- Tailwind utility classes for layout; Material system tokens (`var(--mat-sys-*)`) for colors

## Do not

- Use npm or commit a `package-lock.json`
- Use `HttpClient` directly or put endpoint strings in components
- Add NgModules or `.component` file suffixes
- Put single-feature UI in `shared/components/`
- Recreate a widget that already exists in `shared/components` or Angular Material
- Write user-visible text in English
- Add a nav page without an entry in `app.routes.ts`
- Leave a complex feature change undocumented
