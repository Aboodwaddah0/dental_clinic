# Dental Clinic Frontend — Guidelines

Stack: React 18 + TypeScript + Vite, Tailwind CSS v4 + shadcn/Radix
components, sonner (toasts), motion (animation), react-hook-form,
react-router v7. No MUI, no react-toastify — do not introduce them.

---

## General guidelines

* Refactor code as you go to keep it clean; don't leave dead mock-data
  code paths behind once a page is wired to the real API.
* Keep file sizes small — extract forms/dialogs into their own component
  files (see `PatientForm.tsx` as the pattern to follow).
* No raw `fetch()` calls inside components/pages — everything goes
  through `src/api/`.
* Use responsive flexbox/grid layouts; avoid absolute positioning unless
  truly necessary (dropdown menus, tooltips, etc. already handled by
  Radix internally).

---

## Design tokens (source of truth: `src/styles/theme.css` — never hardcode hex in components)

### Colors (light theme, default)

| Token | Value | Use |
|---|---|---|
| `--background` | `#f0f4f8` | App background |
| `--foreground` | `#0f172a` | Default text |
| `--card` | `#ffffff` | Panels, table rows, modals |
| `--primary` | `#0891b2` | Primary buttons, active nav, links, focus ring |
| `--primary-foreground` | `#ffffff` | Text/icons on primary surfaces |
| `--secondary` | `#e0f2fe` | Active nav-item background, subtle badges |
| `--secondary-foreground` | `#0369a1` | Text on secondary surfaces |
| `--muted` | `#f1f5f9` | Table header background, disabled/subtle surfaces |
| `--muted-foreground` | `#64748b` | Secondary/help text |
| `--accent` | `#ccfbf1` | Rare highlight accents |
| `--destructive` | `#dc2626` | Delete/cancel/error states |
| `--border` | `#e2e8f0` | All borders/dividers |
| `--input-background` | `#f8fafc` | Form field backgrounds |
| `--ring` | `#0891b2` | Focus rings |
| `--radius` | `0.75rem` (12px) | Base radius |

Always consume colors via Tailwind utility classes bound to these vars
(`bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`) —
never raw hex in `className` or inline `style`.

Dark mode (`.dark` class) uses a **separate neutral oklch palette**, not
a darkened version of the cyan theme — this is intentional shadcn-default
dark theming layered under the custom light theme, not a bug. There is no
dark-mode toggle wired up in the app yet.

### Typography (Plus Jakarta Sans, base 15px)

| Level | Tailwind | Weight |
|---|---|---|
| h1 (page title) | `text-xl font-semibold` | 600 |
| h2 | `text-lg font-medium` | 500 |
| h3 | `text-base font-medium` | 500 |
| h4 | `text-sm font-medium` | 500 |
| h5 | `text-sm font-semibold` | 600 |
| h6 | `text-xs font-semibold uppercase tracking-wide` | 600 |
| Body | `text-sm` | 400 |
| Caption / meta | `text-xs text-muted-foreground` | 400 |

Page titles are always `text-xl font-semibold` — do not use `font-bold`
(too heavy) or the bare `theme.css` h1 default (too light) for new pages.

### Spacing & radius

* Page container padding: `p-6`.
* Card/panel: `rounded-xl border border-border bg-card`.
* Buttons/inputs/small controls: `rounded-lg`.
* Pills/badges/avatars: `rounded-full`.
* Vertical rhythm: `space-y-6` at page level, `space-y-4` inside forms,
  `gap-3`/`gap-4` for inline control clusters.

---

## Header conventions

**App-level header** (`Layout.tsx`, already built — keep this pattern):
persistent sidebar (desktop) / slide-over (mobile) + top bar containing a
page-agnostic greeting/date (left) and notification bell + profile menu
with sign-out (right). Never duplicate navigation inside individual pages.

**Page-header pattern** (apply to every route page):

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <Breadcrumb>...</Breadcrumb>   {/* only on nested/detail routes */}
    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
    <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* exactly 0-1 primary action Button, gated by role check */}
  </div>
</div>
```

Rules: exactly one primary action button per page header
(`Button variant="default"`), gated behind `canCreate()`/`canEdit()` where
relevant. `Breadcrumb` only on detail/nested pages (`Patients > Emma
Thompson`), never on top-level list pages.

---

## Component usage rules

* **Lists of records**: shadcn `Table`/`TableHeader`/`TableBody`/
  `TableRow`/`TableCell` — never raw `<table>`. Wrap in
  `rounded-xl border border-border bg-card overflow-hidden`.
* **Pagination**: shadcn `Pagination`, not hand-rolled prev/next buttons.
* **Search boxes**: shadcn `Input` with a leading `Search` icon (lucide).
* **Create/edit forms**: shadcn `Dialog` (not a hand-rolled overlay)
  wrapping `Input`/`Textarea`/`Select`/`Label`, driven by
  `react-hook-form` + a zod schema mirroring the backend's validation.
* **Delete confirmation**: shadcn `AlertDialog`, never a second
  hand-rolled modal.
* **Feedback / notifications**: `sonner` `toast.success()`/
  `toast.error()` for async action results. Do **not** use toasts for
  inline field-validation errors or the appointment 409 conflict — those
  render inline near the relevant field/control.
* **Status indicators**: shadcn `Badge` with a semantic `variant`
  (`default`/`secondary`/`destructive`/`outline`) instead of hand-rolled
  colored `<span>` pills.
* **Buttons**: shadcn `Button` variants — `default` (primary actions),
  `outline` (secondary/cancel), `ghost` (icon-only row actions), `destructive`
  (delete confirms). Never hand-roll button classes.
* **Loading states**: shadcn `Skeleton` for list/table loading.

---

## Motion usage rules — restrained, not decorative

`motion` (the framer-motion successor, already installed) is reserved for
exactly these spots:

1. **Route/page transition** — wrap routed page content in
   `<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
   transition={{duration:0.15}}>`, keyed by route via `AnimatePresence` +
   `useLocation` in `Layout.tsx`.
2. **List item enter/exit** — table rows/grouped items use `motion.tr`/
   `motion.div` + `AnimatePresence` when items are added/removed/filtered
   (opacity/height fade only, 150-200ms).
3. **Dialogs/modals** already animate via Radix + `tw-animate-css` — do
   **not** double up with `motion` on top of Radix's built-in transitions.

Forbidden: bouncy/spring physics on buttons, page-load hero animations,
animating every icon, scroll-triggered reveals. Keep all durations
≤200ms, easing simple (`ease-out`).

---

## Naming & folder conventions

* Top-level shape (keep as-is): `src/app` (routing + shadcn primitives),
  `src/components` (domain components), `src/contexts`, `src/pages`,
  `src/styles`, `src/types`, `src/api` (network layer).
* File naming: PascalCase for components/pages (`PatientDetail.tsx`),
  camelCase for non-component modules (`api/client.ts`). One exported
  component per page/domain-component file.
* Types: domain models (`Patient`, `Appointment`, `User`) live in
  `src/types/index.ts`. API-layer types (`ApiError`,
  `PaginatedResponse<T>`) live in `src/api/`.
* Route-level pages stay in `src/pages/`; reusable pieces extracted from
  a page (forms, dialogs) go in `src/components/`.

---

## API-calling convention

* All network calls go through `src/api/client.ts` — no raw `fetch()`
  inside components/pages.
* Every API function returns the unwrapped `data` (or throws `ApiError`)
  — calling code never touches the backend's `{ data }`/`{ error }`
  envelope directly.
* Field-level validation errors render inline next to the relevant form
  field (via `ApiError.fieldError(field)`); everything else surfaces via
  a `sonner` toast, except the appointment 409 conflict, which renders
  inline near the date/time picker.
* A 401 response anywhere triggers a global logout + redirect to
  `/login` — components never need their own 401 handling.
