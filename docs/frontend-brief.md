# Dental Clinic — Frontend Generation Brief

Paste this whole document to an AI frontend generator as the spec. It
describes the product, the live backend API, the full database shape, and
suggested pages/screens.

---

## 1. Product

A dental clinic management system. Clinic staff (currently just the single
role `doctor`) log in and manage patients, appointments, clinical records
(visits, per-tooth dental history), files, and billing.

## 2. Backend & auth

REST API, Node/Express, JSON everywhere. Base URL: `http://localhost:4000/api`
(configurable via `PORT`).

**Auth flow:**
1. `POST /api/auth/login` with `{ email, password }` → `{ access_token, user }`
2. Store `access_token`; send `Authorization: Bearer <token>` on every
   subsequent request.
3. `GET /api/auth/me` → `{ user: { id, role, full_name } }` — use on app
   load to restore session / get current user.
4. `401` → not authenticated, redirect to login. `403` → authenticated but
   lacking the `doctor` role — hide/disable write actions (create/edit/
   delete buttons), reads still work.

There is only one role right now (`doctor`). Build the UI as if a second
role could exist later (keep permission checks centralized), but don't
build a role-switcher or admin panel — it doesn't exist yet.

## 3. API conventions

- Success responses: `{ data: <object|array> }`; list endpoints also
  include `count` (total matching rows, for pagination).
- Error responses: `{ error: string }` or, for validation errors, `{ error:
  <zod flattened error object> }` — show `error.fieldErrors[<field>]` next
  to the relevant form field when present, else show `error` as a toast.
- Status codes: `200` read/update, `201` create, `204` delete (empty body),
  `400` validation, `401` unauthenticated, `403` forbidden, `404` not
  found, `409` conflict (e.g. double-booked appointment), `500` server error.
- Pagination: `limit`/`offset` query params, default `20`/`0`.
- IDs are UUIDs everywhere. Timestamps are ISO 8601 (`timestamptz`).

## 4. Endpoints that exist today

```
POST   /api/auth/login          { email, password } -> { access_token, user }
GET    /api/auth/me             (auth)               -> { user }

GET    /api/patients            (auth) ?search=&limit=&offset=
GET    /api/patients/:id        (auth)
POST   /api/patients            (doctor)
PATCH  /api/patients/:id        (doctor)
DELETE /api/patients/:id        (doctor)              -> 204
```

## 5. Endpoints planned but not built yet

Design pages for these, but the frontend generator should treat them as
"coming soon" / stub the API call behind a clearly-named function so
wiring them up later is a one-line change:

```
GET/POST/PATCH /api/appointments   (no DELETE — cancel via status)
```

There is no doctor-availability/working-hours concept in this system — any
doctor can be booked at any time; the only constraint is no double-booking
for the same doctor.

Visits, dental records, patient files, invoices, and payments have no
endpoints yet at all — only the database tables exist (see below). Build
these as normal CRUD-shaped pages against the field lists below; they'll
need endpoints added later following the same pattern as `patients`.

## 6. Data model (9 tables)

**profiles** — staff accounts (id links to Supabase Auth)
`id, full_name, email, phone, role ('doctor'), specialty, created_at`

**patients**
`id, full_name*, phone*, date_of_birth, gender ('male'|'female'|'other'), address, blood_type, allergies (freetext), medical_notes (freetext), registered_by -> profiles, created_at, updated_at`

**appointments**
`id, patient_id* -> patients, doctor_id* -> profiles, appointment_date* (date), start_time* (time), end_time* (time), status* ('scheduled'|'completed'|'cancelled'), notes, created_at, updated_at`

**visits** — one freeform record per clinical encounter
`id, patient_id* -> patients, doctor_id* -> profiles, appointment_id -> appointments (nullable), diagnosis, treatment, notes, created_at`

**patient_files** — X-rays / photos / PDFs
`id, patient_id* -> patients, file_url*, file_type ('xray'|'image'|'pdf'), description, uploaded_by -> profiles, created_at`

**teeth** — fixed reference catalog, 52 rows, already seeded
`id, fdi_number* (2-digit FDI/ISO-3950 code, e.g. "36"), name, dentition_type ('primary'|'permanent')`
FDI ranges: permanent teeth `11–48`, primary/deciduous teeth `51–85`.

**dental_records** — append-only per-tooth condition history
`id, patient_id* -> patients, tooth_id* -> teeth, doctor_id* -> profiles, condition (freetext, e.g. "Caries", "Filling"), description, treatment, status* ('active'|'resolved'|'extracted'), created_at`

**invoices**
`id, patient_id* -> patients, total_amount*, paid_amount (server-computed, default 0), status ('unpaid'|'partially_paid'|'paid', server-computed), created_at`

**payments**
`id, invoice_id* -> invoices, amount*, payment_method* ('cash'|'card'|'transfer'), received_by -> profiles, payment_date`

`*` = required field. Foreign keys shown as `-> table`.

**Important:** `invoices.paid_amount` and `.status` are recomputed
server-side by a database trigger whenever a payment is added/edited/
removed. The frontend must never try to set or compute these — just POST
to create a payment, then refetch the invoice.

## 7. Domain notes

- `dental_records` is append-only history, not an editable record — the
  UI should feel like "add a condition entry to this tooth's timeline,"
  not "edit the tooth's current condition." Multiple entries per tooth are
  normal and expected.
- `visits` similarly is one row per encounter, not editable-in-place after
  the fact in typical use (though a PATCH endpoint could exist later).
- `allergies` and `medical_notes` on `patients` are plain freetext fields
  (not a structured multi-select) — a simple textarea per field is enough.
- Appointment conflict handling: a `409` from `POST`/`PATCH
  /api/appointments` means the doctor already has an overlapping
  appointment — surface this as an inline error near the date/time
  picker, not a generic toast, since the user needs to pick a different
  slot.

## 8. Suggested pages/screens

1. **Login** — email/password form, calls `POST /api/auth/login`.
2. **Dashboard** — today's appointments for the logged-in doctor, quick
   counts (patients, upcoming appointments).
3. **Patients list** — searchable/paginated table (`search`, `limit`,
   `offset`), row click → patient detail.
4. **Patient detail** — tabs: Profile, Appointments, Visits, Dental Chart,
   Files, Billing. Edit button behind `doctor` role.
5. **Patient create/edit form** — matches the `patients` field list above.
6. **Appointments** — calendar or list view, filterable by doctor/patient/
   status/date range (`GET /api/appointments?doctor_id=&patient_id=&status=&from=&to=`
   once built).
7. **Appointment create/edit form** — date + start/end time pickers,
   patient/doctor selects, status, notes. Surface `409` conflicts inline.
8. **Dental chart** — visual FDI tooth diagram (32 permanent + 20 primary
   positions); clicking a tooth shows its `dental_records` history and an
   "add condition" action.
9. **Visit form** — diagnosis/treatment/notes fields, optional link to an
   appointment.
10. **Patient files** — upload/list X-rays, images, PDFs with type/description.
11. **Billing** — invoice list per patient; invoice detail shows
    `total_amount`/`paid_amount`/`status` plus a payment history list and
    an "add payment" form (amount, method); after posting, refetch the
    invoice to show the server-updated `paid_amount`/`status`.
