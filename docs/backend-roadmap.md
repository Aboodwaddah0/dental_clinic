# Dental Clinic Backend — Phased Roadmap

Architecture: a custom Node/TypeScript API server sits in front of Supabase.
The server holds the `service_role` key (bypasses RLS) and is the **only**
place authorization decisions are made — it verifies the caller's Supabase
Auth JWT, loads their `profiles.role`, and allows/denies each request. RLS
policies already in `supabase/migrations/20260712000023_rls_policies.sql`
stay in place as a second line of defense, not the primary gate.

**Schema note:** the database went through a full simplification reset
(9 tables: `profiles`, `patients`, `appointments`, `visits`,
`patient_files`, `teeth`, `dental_records`, `invoices`, `payments`).
There is no `doctor_working_hours`, `doctor_time_off`, or
`appointment_reminders` table — no doctor-availability/scheduling concept
at all, and no patient/inventory/treatment catalogs — see `docs/erd.md`
for the current graph.

## Phase overview

| Phase | Scope |
|---|---|
| **1** | Project scaffold, auth middleware, patients CRUD |
| **2** | Appointments CRUD with double-booking guard (per doctor, per date/time) |
| 3 | Clinical: `visits`, `dental_records` |
| 4 | Billing: `invoices`, `payments` (denormalized, kept in sync by a DB trigger) |

Each phase after 1 follows the same shape (routes → controller → service →
Supabase call), so Phase 1 also serves as the template for later phases.

---

# Phase 1 — Auth + Patients

## Goal

A running API where a doctor can log in and perform full CRUD on patient
records, with every write rejected unless the caller has an active
`profiles.role = 'doctor'` row. This is the walking skeleton every later
phase builds on.

## 1. Project setup

```bash
npm install express cors helmet morgan zod dotenv
npm install -D @types/express @types/cors @types/morgan tsx typescript
```

`tsconfig.json` (currently empty — fill it in):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

`.env` (add `.env` to `.gitignore` if not already ignored):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PORT=4000
```

Add to `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## 2. Folder structure

```
src/
  index.ts                 # express app bootstrap
  config/env.ts             # loads + validates process.env
  lib/supabase.ts           # single service-role client instance
  middleware/
    auth.ts                 # requireAuth, requireRole('doctor')
    errorHandler.ts
  modules/
    auth/
      auth.routes.ts         # POST /login, GET /me
      auth.controller.ts
      auth.service.ts
    patients/
      patients.routes.ts     # /api/patients CRUD
      patients.controller.ts
      patients.service.ts
      patients.schema.ts     # zod input validation
  types/
    express/index.d.ts       # augments Request with req.user
```

## 3. Build order (do these in sequence — each step is testable on its own)

1. **`config/env.ts`** — read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `PORT` from `process.env`, throw at startup if any is missing. Fail fast,
   don't let a misconfigured server start silently.
2. **`lib/supabase.ts`** — `createClient(url, serviceRoleKey)` once, export
   it. Every service module imports this same instance.
3. **`index.ts`** — bare Express app with `helmet()`, `cors()`, `morgan()`,
   `express.json()`, a `GET /health` route, and `app.listen`. Run `npm run
   dev`, confirm `GET /health` responds, before writing any business logic.
4. **`middleware/auth.ts`**:
   - `requireAuth`: read `Authorization: Bearer <token>`, call
     `supabase.auth.getUser(token)`. 401 if missing/invalid. On success,
     fetch the matching `profiles` row and attach `req.user = { id, role,
     full_name }`.
   - `requireRole('doctor')`: 403 if `req.user.role` doesn't match. Compose
     after `requireAuth` on write routes.
5. **`modules/auth`**:
   - `POST /api/auth/login` — proxies `supabase.auth.signInWithPassword({
     email, password })`, returns `{ access_token, user }`. Validate body
     with zod first.
   - `GET /api/auth/me` — behind `requireAuth`, returns `req.user`. Use this
     as your smoke test for the whole auth chain.
6. **`modules/patients`** (all behind `requireAuth`; writes also behind
   `requireRole('doctor')`):
   - `GET /api/patients?search=` — list, `ilike` search against
     `full_name`/`phone` (the trigram indexes already support this),
     paginated (`limit`/`offset` query params, default 20/0).
   - `GET /api/patients/:id` — 404 if not found.
   - `POST /api/patients` — zod schema mirrors the `patients` table's
     `not null` columns (`full_name`, `phone` required; rest optional).
     Sets `registered_by = req.user.id`.
   - `PATCH /api/patients/:id` — partial update, same zod schema
     `.partial()`.
   - `DELETE /api/patients/:id` — hard delete (no `deleted_at` column in the
     schema); confirm with the user before wiring this to a UI, since
     patient deletion cascades are not modeled — check FK constraints in
     `docs/erd.md` first if this becomes a problem.
7. **`middleware/errorHandler.ts`** — last `app.use`, catches thrown errors,
   maps zod validation errors to 400, Supabase/Postgres errors to 500 (log
   the real error server-side, return a generic message to the client).

## 4. Request flow (auth → patients)

```
Client                     API Server                      Supabase
  |                            |                                |
  |--POST /api/auth/login----->|                                |
  |                            |--signInWithPassword----------->|
  |                            |<--session { access_token }-----|
  |<--{ access_token }---------|                                |
  |                            |                                |
  |--GET /api/patients-------->|                                |
  |  Authorization: Bearer ... |                                |
  |                            |--auth.getUser(token)----------->|
  |                            |<--user {id}--------------------|
  |                            |--select * from profiles-------->|
  |                            |   where id = user.id            |
  |                            |<--profile {role: 'doctor'}------|
  |                            | (requireRole passes)            |
  |                            |--select * from patients-------->|
  |                            |   where full_name ilike ...     |
  |                            |<--rows--------------------------|
  |<--200 [patients]-----------|                                |
```

## 5. Definition of done for Phase 1

- [ ] `npm run dev` starts the server; `GET /health` returns 200.
- [ ] Logging in with a seeded doctor account returns a token from
      `POST /api/auth/login`.
- [ ] `GET /api/auth/me` with that token returns the doctor's profile.
- [ ] All five patient endpoints work against a real (local Supabase)
      database, verified with curl/Postman — not just typechecked.
- [ ] A request with no token gets 401; a request from a non-doctor role
      (once more roles exist) gets 403 on write routes.
- [ ] Invalid patient payloads (missing `full_name`/`phone`) get 400 with a
      useful message, not a raw Postgres error.

Once this checklist is green, Phase 2 (appointments) reuses the exact same
`requireAuth`/`requireRole` middleware and module structure — only the
domain changes.

---

# Phase 2 — Appointments

## Goal

Any authenticated staff member can book, view, and update appointments,
with the server rejecting any appointment that overlaps another
appointment for the same doctor. There is no doctor-availability/working-
hours concept in this system — any doctor can be booked at any time, the
only constraint enforced is "a doctor can't be in two places at once."

## 1. New domain errors

Two more error types join `NotFoundError` in `lib/errors.ts`, mapped in
`middleware/errorHandler.ts` exactly like `NotFoundError` is — services stay
HTTP-agnostic, the middleware is still the only place status codes happen:

- `ValidationError` → 400 (Postgres check/FK/unique constraint violations —
  e.g. `end_time <= start_time`, or a `doctor_id` that doesn't exist)
- `ConflictError` → 409 (double-booking)

## 2. Folder structure

```
src/modules/
  appointments/
    appointments.schema.ts
    appointments.service.ts
    appointments.controller.ts
    appointments.routes.ts     # /api/appointments
```

## 3. Build order

1. **`lib/errors.ts` + `middleware/errorHandler.ts`** — add `ValidationError`
   (400) and `ConflictError` (409).
2. **`modules/appointments`** (all behind `requireAuth`; writes also behind
   `requireRole('doctor')`):
   - `GET /api/appointments?doctor_id=&patient_id=&status=&from=&to=` — list
     with filters (`from`/`to` filter on `appointment_date`), paginated.
   - `GET /api/appointments/:id` — 404 if missing.
   - `POST /api/appointments` — before inserting, query for any existing
     appointment for the same `doctor_id` on the same `appointment_date`
     where `status` isn't `cancelled` and the `start_time`/`end_time` ranges
     overlap (`existing.start < new.end AND existing.end > new.start`); if
     found, throw `ConflictError`.
   - `PATCH /api/appointments/:id` — status changes (`completed`,
     `cancelled`) and time/notes edits. If the date/time changes, re-run the
     same conflict check (excluding the appointment's own id).
   - **No `DELETE` route** — appointments are cancelled via
     `PATCH { status: "cancelled", notes }`, not removed, so the history
     stays intact (same append-only spirit as `dental_records`).

## 4. Conflict-check flow (appointment create/update)

```
POST /api/appointments
  |
  |-- zod: end_time > start_time? --no--> 400
  |-- query appointments where doctor_id = X
  |     and appointment_date = new.date and status != cancelled
  |     and existing.start_time < new.end_time
  |     and existing.end_time > new.start_time
  |-- any rows? --yes--> 409 ConflictError
  |-- insert
  |-- FK violation (bad patient_id/doctor_id)? --yes--> 400 ValidationError
  |-- 201 { data: appointment }
```

## 5. Definition of done for Phase 2

- [ ] Creating overlapping appointments for the same doctor returns 409 on
      the second one; a non-overlapping appointment for the same doctor at a
      different time succeeds.
- [ ] Moving an existing appointment's time into another appointment's slot
      (via `PATCH`) also returns 409.
- [ ] `POST /api/appointments` with a `patient_id`/`doctor_id` that doesn't
      exist returns 400, not a raw Postgres foreign-key error.
- [ ] `GET /api/appointments?doctor_id=&from=&to=` returns only matching,
      correctly time-filtered results.
- [ ] All write routes still reject unauthenticated (401) and non-doctor
      (403) callers, same as Phase 1.

---

# Phase 3 — Clinical (`teeth`, `dental_records`, `visits`, `patient_files`)

## Goal

Expose the tooth chart and clinical history: a read-only tooth catalog, an
append-only per-tooth condition history, freeform visit records, and
patient file metadata.

**Assumption:** the backend never handles raw file bytes. `patient_files`
just stores a `file_url` the client already has (uploaded to Supabase
Storage, S3, or wherever) — no upload/multipart endpoint is built here.
This isn't a real open question, just a scope note: file storage is the
frontend's problem, not this API's.

## 1. Folder structure

```
src/modules/
  teeth/
    teeth.service.ts
    teeth.controller.ts
    teeth.routes.ts          # /api/teeth (read-only)
  dental-records/
    dental-records.schema.ts
    dental-records.service.ts
    dental-records.controller.ts
    dental-records.routes.ts # /api/dental-records
  visits/
    visits.schema.ts
    visits.service.ts
    visits.controller.ts
    visits.routes.ts         # /api/visits
  patient-files/
    patient-files.schema.ts
    patient-files.service.ts
    patient-files.controller.ts
    patient-files.routes.ts  # /api/patient-files
```

## 2. Build order

1. **`modules/teeth`** (behind `requireAuth` only — it's a fixed reference
   catalog, no write routes at all):
   - `GET /api/teeth` — all 52 rows, ordered by `fdi_number`. No schema
     file needed (no input to validate).

2. **`modules/dental-records`** (reads behind `requireAuth`; writes behind
   `requireRole('doctor')`):
   - `GET /api/dental-records?patient_id=&tooth_id=&limit=&offset=`
   - `GET /api/dental-records/:id` — 404 if missing.
   - `POST /api/dental-records` — `patient_id`, `tooth_id` required;
     `condition`, `description`, `treatment` optional; `status` defaults to
     `'active'` in the DB but can be set explicitly (e.g. logging an
     extraction directly as `'extracted'`). `doctor_id` is **never**
     accepted from the client — always `req.user.id`, same reasoning as
     `patients.registered_by`.
   - **No `PATCH`/`DELETE`** — append-only, matches the existing
     `docs/erd.md` design note. Corrections are new rows, not edits.

3. **`modules/visits`** (same auth shape as dental-records):
   - `GET /api/visits?patient_id=&doctor_id=&limit=&offset=`
   - `GET /api/visits/:id`
   - `POST /api/visits` — `patient_id` required, `appointment_id` optional
     (links back to the appointment it came from), `diagnosis`/
     `treatment`/`notes` optional. `doctor_id` forced to `req.user.id`.
   - **No `PATCH`/`DELETE`** for the same reason as dental-records — one
     row per encounter, not an editable record. (Can be added later if a
     real correction workflow is needed.)

4. **`modules/patient-files`** (same auth shape):
   - `GET /api/patient-files?patient_id=&file_type=&limit=&offset=`
   - `GET /api/patient-files/:id`
   - `POST /api/patient-files` — `patient_id`, `file_url` required;
     `file_type` (`xray`/`image`/`pdf`), `description` optional.
     `uploaded_by` forced to `req.user.id`.
   - `DELETE /api/patient-files/:id` — unlike the append-only clinical
     tables, a wrongly-attached file (wrong patient, wrong upload) is a
     legitimate thing to remove outright; this table doesn't carry the
     same audit-trail requirement.

## 3. Error handling

All four modules reuse the existing domain errors — no new ones needed:
- `NotFoundError` → 404 for missing `:id` lookups
- `ValidationError` → 400 for bad FKs (nonexistent `patient_id`/`tooth_id`/
  `appointment_id`) via `isConstraintViolation` from `lib/pg-error-codes.ts`

## 4. Definition of done for Phase 3

- [ ] `GET /api/teeth` returns all 52 seeded rows with no auth beyond a
      valid token (no role requirement).
- [ ] `POST /api/dental-records` with a bad `tooth_id` returns 400, not a
      raw Postgres FK error; a valid one returns 201 with `doctor_id` set
      to the caller, not from the request body.
- [ ] `POST /api/visits` with `appointment_id` omitted still succeeds
      (it's nullable).
- [ ] `POST /api/patient-files` then `DELETE` it returns 204, and a
      second `DELETE` on the same id returns 404.
- [ ] All four modules' write routes reject unauthenticated (401) and
      non-doctor (403) callers; reads only require a valid token.
