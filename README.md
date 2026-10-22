# Hakim — book a clinic appointment in Addis Ababa

CodeOps · Module 3 capstone. Started Day 35 (React + Vite); moves to Next.js
from Day 36.

## The brief

### The problem

Seeing a specialist in Addis Ababa usually starts with a queue. Most private
clinics hand out a limited number of "cards" each morning, so a patient — or,
just as often, a son or daughter booking for a parent — arrives before dawn,
waits for a number, and only then finds out whether the doctor they wanted is
in that day. The alternative is calling a reception line that is busy for the
same reason. Nobody can see, ahead of time, which doctors have free time this
week.

### The user

One user: **the patient**, or the family member booking on their behalf. They
know roughly what kind of doctor they need (a paediatrician, a dentist, an
internist) and which part of the city they can get to. They are on a phone,
often on a slow connection.

### What they do

They pick a specialty and an area, compare the clinics that match, open one to
see its doctors and each doctor's open slots for the coming week, and book a
slot with a name and a phone number. They get a booking reference straight
away. Later they come back to see what they have booked, and cancel a booking
they can no longer make so the slot goes back to someone else.

### The main features

- Browse clinics, filtered by specialty and area, with the filters in the URL
  so a search can be shared.
- See one clinic's doctors and their open slots for the next seven days.
- Book a slot through a validated form (patient name, Ethiopian mobile number,
  reason for the visit, and whether it is for someone else).
- See all of your bookings, open one, and cancel it.
- Sign-in protects booking and your appointments; browsing is open to anyone.

**Out of scope**, on purpose: the clinic's side (managing doctors and
schedules), payments, SMS reminders, ratings and reviews, and more than one
kind of user. Each would be a project of its own.

### The screens, and the data each one needs

**Home** introduces Hakim and lists the specialties, each linking to the
clinics that offer it. It needs only the list of specialties.

**Clinics** lists the clinics that match the chosen specialty and area. It
needs every clinic's name, area, specialties and the soonest open slot, plus
the two filters, which it reads from the query string.

**Clinic** shows one clinic: its address, opening hours and its doctors, each
with their open slots over the next seven days. It needs that clinic, its
doctors, and their slots — fetched by the clinic's id from the URL.

**Book** confirms the chosen slot (doctor, clinic, date and time) and takes the
patient's details. It needs the one slot, by id, and the signed-in user to
pre-fill the phone number. On success it moves to the new appointment.

**My appointments** lists the signed-in user's bookings, upcoming first, with
past ones below. It needs that user's appointments.

**Appointment** shows one booking — reference, doctor, clinic, time, patient —
with a cancel action. It needs that appointment by id, and refuses to show one
that belongs to somebody else.

Two supporting screens complete the map: **Sign in**, and **Not found** for any
address that does not exist.

## Route map

| Path | Screen | Parameters | Sign-in |
| --- | --- | --- | --- |
| `/` | Home | — | No |
| `/clinics` | Clinics | `?specialty=` `?area=` (query) | No |
| `/clinics/:clinicId` | Clinic | `clinicId` | No |
| `/book/:slotId` | Book | `slotId` | **Yes** |
| `/appointments` | My appointments | — | **Yes** |
| `/appointments/:appointmentId` | Appointment | `appointmentId` | **Yes** |
| `/login` | Sign in | `state.from` (where to return) | No |
| `*` | Not found | — | No |

Dynamic routes: `/clinics/:clinicId`, `/book/:slotId`,
`/appointments/:appointmentId`. Guarded routes send a signed-out visitor to
`/login` and back again afterwards.

## The plan

### Component tree, with ownership

```
App
└─ Layout                     header, nav, <Outlet />, footer
   ├─ Home                    reads: specialties (fetched)
   ├─ Clinics                 owns: specialty + area (URL), clinics (fetched)
   │  ├─ FilterBar            props: specialty, area, onChange
   │  └─ ClinicList           props: clinics
   │     └─ ClinicCard        props: clinic
   ├─ Clinic                  reads: :clinicId — owns: clinic + doctors (fetched)
   │  └─ DoctorSlots          props: doctor, slots — owns: selected day
   ├─ RequireAuth             reads: session (context)
   │  ├─ Book                 owns: form, touched, submitting — reads: :slotId
   │  ├─ Appointments         owns: appointments (fetched)
   │  └─ Appointment          reads: :appointmentId — owns: cancelling
   ├─ Login                   owns: phone field
   └─ NotFound
```

### Where state lives

| State | Where | Why |
| --- | --- | --- |
| Specialty and area filters | The URL query string | Shareable, survives a refresh and the back button |
| Fetched clinics, doctors, slots | The screen that shows them | Server data; nobody else needs it (until Day 41) |
| Which day is open in a doctor's slots | `DoctorSlots` | Only that component reads or changes it |
| The booking form | `Book`, and nowhere else | Local, short-lived, discarded on success |
| Sign-in session | Context, behind a `useAuth` hook | Rarely changes, needed by the guard and the header |
| The user's appointments | Fetched by `Appointments` | Server data — not a global store |

There is no global store on purpose: unlike a cart, nothing here is built up
across several screens.

### Folders, by feature

```
src/
  api/            fetch helpers, one per resource
  hooks/          useFetch — genuinely reusable only
  ui/             Layout, Spinner, Modal — no clinic logic
  auth/           AuthProvider, useAuth, RequireAuth, Login
  clinics/        Clinics, FilterBar, ClinicList, ClinicCard, Clinic, DoctorSlots
  booking/        Book, validate.js, Field
  appointments/   Appointments, Appointment
  pages/          Home, NotFound
```

### Build order — vertical slices

1. Routes and Layout: every screen reachable, even if empty. **(Day 35)**
2. Clinics: fetch, loading, empty, error, list — then the URL filters.
3. Clinic: one clinic by id, its doctors and slots.
4. Sign-in and the guard.
5. Book: the validated form, submitting state, failure path.
6. Appointments: list, detail, cancel.
7. Error boundary, lazy routes, polish — then onto Next.js as the course goes.

### Data

One source: a mock API served by the dev server (clinics, doctors, slots,
appointments as JSON), with a deliberate delay and a `?fail=1` switch so the
loading and error states can be seen. From Day 36 it becomes Next.js API
routes.

## Run it

```bash
npm install
npm run dev
```

## Status

**Day 35 — scaffold.** Every route on the map is reachable. Each screen is a
placeholder that names the data it will need. Signing in is a stand-in
(any phone number, kept in `localStorage`), but the guard is real:
`/book/:slotId`, `/appointments` and `/appointments/:appointmentId` send a
signed-out visitor to `/login` and return them afterwards.

Checked in headless Chromium: all six open routes render their screen, an
unknown path renders Not found, the three guarded routes redirect when signed
out, and sign-in returns to the page that was asked for.
