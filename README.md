# Hakim — book a clinic appointment in Addis Ababa

CodeOps · Module 3 capstone. Started Day 35 (React + Vite); on Next.js 16
(App Router) since Days 36–40.

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

| Path | Screen | Parameters | Sign-in | File |
| --- | --- | --- | --- | --- |
| `/` | Home | — | No | `app/page.js` |
| `/clinics` | Clinics | `?specialty=` `?area=` (query) | No | `app/clinics/page.js` (+ `loading.js`, `error.js`) |
| `/clinics/:clinicId` | Clinic | `clinicId` | No | `app/clinics/[clinicId]/page.js` |
| `/book/:slotId` | Book | `slotId` | **Yes** | `app/(account)/book/[slotId]/page.js` |
| `/appointments` | My appointments | — | **Yes** | `app/(account)/appointments/page.js` |
| `/appointments/:appointmentId` | Appointment | `appointmentId` | **Yes** | `app/(account)/appointments/[appointmentId]/page.js` |
| `/login` | Sign in | `?from=` (where to return) | No | `app/login/page.js` |
| `*` | Not found | — | No | `app/not-found.js` |

Dynamic routes: `/clinics/:clinicId`, `/book/:slotId`,
`/appointments/:appointmentId`. Guarded routes send a signed-out visitor to
`/login?from=<where they were going>` and back again afterwards. On Vite the
return path travelled in router state; on Next.js the redirect happens on the
server, so it travels in the query string (checked by `safeReturnPath()` so the
login page cannot be used as an open redirect).

`(account)` is a route group: it gives the three signed-in screens one layout
without adding a segment to the URL.

## The plan

### Component tree, with ownership

S = server component, C = client component (`"use client"`).

```
app/layout.js (S)              html, header, footer — reads no cookie
└─ Providers (C)               AuthProvider: who is signed in, for the header
   ├─ NavTabs (C)              usePathname — the open tab
   ├─ AuthMenu (C)             Sign in / Sign out (form → signOut action)
   ├─ page.js — Home (S)       specialties + areas, from the build
   ├─ clinics/page.js (S)      reads searchParams — owns: the filters (URL)
   │  ├─ FilterBar (S)         a GET <Form>; the URL is its state
   │  └─ <Suspense>
   │     └─ ClinicList (S)     awaits listClinics() — no useFetch
   │        └─ ClinicCard (S)  props: clinic
   ├─ clinics/[clinicId] (S)   awaits getClinic(id)
   │  └─ DoctorSlots (C)       props: week — owns: selected day
   ├─ login/page.js (S)        reads ?from= and the session
   │  └─ LoginForm (C)         owns: phone field — action: signIn
   ├─ (account)/layout.js (S)  sub-nav; force-dynamic
   │  ├─ book/[slotId] (S)     requireUser, awaits getSlot(id)
   │  │  └─ BookingForm (C)    owns: values, touched — action: bookAppointment
   │  ├─ appointments (S)      requireUser, awaits the user's bookings
   │  └─ appointments/[id] (S) requireUser, awaits the booking if it is theirs
   │     └─ CancelForm (C)     owns: confirming — action: cancelAppointment
   ├─ error.js / clinics/error.js (C)
   └─ not-found.js (S)
```

`RequireAuth` is gone: a client-side guard cannot stop a server render, so
each guarded page calls `requireUser()` on the server, and each action and
handler checks the session again itself. See [BOUNDARY.md](BOUNDARY.md) for
the one-line reason behind every component's side.

### Where state lives

| State | Where | Why |
| --- | --- | --- |
| Specialty and area filters | The URL query string | Shareable, survives a refresh and the back button |
| Clinics, doctors, slots | Read on the server by the page that shows them | Server data; no endpoint or effect in between |
| Which day is open in a doctor's slots | `DoctorSlots` | Only that component reads or changes it |
| The booking form | `BookingForm`, and nowhere else | Local, short-lived, discarded on success |
| Sign-in session | A signed, httpOnly cookie, read on the server by `lib/session.js` | The server decides who may do what |
| "Who is signed in" for the header | `AuthProvider` context, behind `useAuth` | Display only; fetched from `/api/session` so the root layout stays static |
| The user's appointments | Read on the server by the two appointment pages | Server data — not a global store |

There is no global store on purpose: unlike a cart, nothing here is built up
across several screens.

### Folders

```
app/                 routes only — page, layout, loading, error, not-found, route
  actions.js         the four server actions
  providers.jsx      every provider, in one client file
  clinics/           Clinics, FilterBar, ClinicList, ClinicCard (not routes)
    [clinicId]/      Clinic, DoctorSlots
  login/             Sign in, LoginForm
  (account)/         the signed-in screens: book/[slotId], appointments, appointments/[appointmentId]
  api/               route handlers
auth/                AuthProvider, AuthContext, useAuth
components/          shared by more than one route: Field, NavTabs, AuthMenu, SlotSummary
lib/                 data, store, session, schema (shared by forms and server), slots, clock
data/                JSON seed: clinics, doctors, specialties, areas, appointments
```

### Build order — vertical slices

1. Routes and Layout: every screen reachable, even if empty. **(Day 35)** ✓
2. Clinics: fetch, loading, empty, error, list — then the URL filters. ✓
3. Clinic: one clinic by id, its doctors and slots. ✓
4. Sign-in and the guard. ✓
5. Book: the validated form, submitting state, failure path. ✓
6. Appointments: list, detail, cancel. ✓
7. Error boundaries, streaming, polish — on Next.js. ✓

### Data

There is no mock API any more: the pages are server components and read
[lib/data.js](lib/data.js) directly.

- **Clinics, doctors, specialties, areas** are JSON in [data/](data/), bundled
  at build time. Each doctor has a weekly schedule ("Mon, Wed, Fri,
  14:00–17:00, every 30 minutes").
- **Slots are never stored.** [lib/slots.js](lib/slots.js) works out the next
  seven days from each schedule, relative to today in Addis Ababa (UTC+3), and
  drops times that have passed or are held by a booking. A slot id carries the
  doctor, date and time (`dr-hanna-tesfaye--20261024-0930`), so `/book/:slotId`
  can check it without a lookup table.
- **Bookings** are the only writes. [lib/store.js](lib/store.js) keeps them in
  `.data/appointments.json` (git-ignored). Until the first write the seed in
  `data/appointments.json` is used, laid out relative to today, so there are
  always upcoming, past and cancelled examples. Delete `.data/` to reset.
- `/clinics?fail=1` makes the read throw (the old mock's switch), and the list
  read waits 700 ms so the skeleton can be seen.

**Limitation, on purpose:** the store is one JSON file on the server's disk,
with a lock inside one Node process. It is right for `next start` on one
machine and wrong for a serverless host (read-only or throw-away disk) or more
than one server. A database replaces it later; only `lib/store.js` changes.

## Run it

```bash
npm install
npm run build        # prints the route table below
npm run start        # http://localhost:3000 — or: npm run start -- -p 3350
npm run dev          # for development only; never judge strategy from it
npm run lint
```

Optional: `cp .env.example .env.local` and set `SESSION_SECRET`. Without it
the server makes a random key at start, and everyone is signed out on restart.

Demo accounts (sign-in asks only for a number — see Status): **0911 234 567**
has upcoming, past and cancelled bookings; **0922 765 432** owns `HK-2PB6Y`,
which the first account must not be able to cancel.

## Endpoints

Server actions (in [app/actions.js](app/actions.js)) are what the site's own
forms use. The route handlers are for callers outside the site — a mobile app,
`curl` — except `/api/session`, which the header calls. Every failure has one
shape: `{ "error": "...", "fieldErrors": { "phone": ["..."] } }`.

| Endpoint | Status codes |
| --- | --- |
| `GET /api/clinics?specialty=&area=` | 200 `{ clinics }` · 400 unknown filter |
| `GET /api/slots/:slotId` | 200 `{ slot }` (with `taken`) · 404 |
| `GET /api/appointments` | 200 the user's own · 401 |
| `POST /api/appointments` | 201 `{ appointment }` + `Location` · 400 not JSON · 401 · 404 no such slot · 409 already booked · 422 `fieldErrors` |
| `GET /api/appointments/:id` | 200 · 401 · 404 (also for someone else's) |
| `DELETE /api/appointments/:id` | 200 cancelled · 401 · 403 someone else's · 404 · 409 already started |
| `GET /api/session` | 200 `{ user }` or `{ user: null }` |

| Server action | Checks, inside the action |
| --- | --- |
| `signIn` | Phone against `lib/schema.js`; return path against `safeReturnPath` |
| `bookAppointment` | Session; the whole form against `lib/schema.js` (same rules as the form); slot exists and is free; then `revalidatePath` the clinic page |
| `cancelAppointment` | Session; the booking exists **and belongs to the session's user**; not already started; then `revalidatePath` |
| `signOut` | — |

## Build output

`npm run build`, Next.js 16.4.2:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/appointments
├ ƒ /api/appointments/[appointmentId]
├ ƒ /api/clinics
├ ƒ /api/session
├ ƒ /api/slots/[slotId]
├ ƒ /appointments
├ ƒ /appointments/[appointmentId]
├ ƒ /book/[slotId]
├ ƒ /clinics
├   /clinics/[clinicId]
│ ├ ● /clinics/selam-family-clinic
│ ├ ● /clinics/abay-eye-and-skin
│ ├ ● /clinics/kazanchis-dental-centre
│ └ ● [+5 more paths]
└ ƒ /login


○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Each marker matches [STRATEGY.md](STRATEGY.md). This version of Next.js no
longer prints a size or First Load JS column, so there are no bundle figures
to compare with Day 35 here.

## Status

**Days 36–40 — on Next.js, every slice built.** Every route on the Day 35 map
is reachable and does its job: clinics filtered through the URL with loading,
empty and error states; a clinic's doctors with seven days of open slots;
sign-in; booking through a validated form; your appointments, one
appointment, and cancelling it.

What is real: the server/client boundary, the rendering strategy per route,
validation on the server with the same schema the forms use, and authorisation
inside every action and handler (session, then ownership).

What is still a stand-in:

- **Sign-in proves nothing about who you are.** Any 09… number signs you in as
  that number. The cookie is httpOnly and HMAC-signed, so it cannot be *edited*
  into someone else's — but anyone can sign in *as* someone else by typing
  their number. Real authentication (a code by SMS, or a password) is Day 42/45.
- **The store is a JSON file** (see Data).
- The header shows "Sign in / Sign out" a moment after the rest of the page,
  because it asks `/api/session` from the browser (see STRATEGY.md for why).
- Times are shown on the 24-hour international clock, not Ethiopian local time.

## Verified

Against the production build (`npm run build && npm run start -- -p 3350`),
with `.data/` deleted first:

| Check | Result |
| --- | --- |
| `npm run build` | Passes; routes and markers as above |
| `npm run lint` | No warnings, no errors |
| `curl` `/`, `/clinics`, `/clinics?specialty=dentistry&area=kazanchis`, `/clinics/selam-family-clinic`, `/login` | 200 |
| `curl` `/appointments`, `/appointments/HK-4K7QD`, `/book/<slot>` signed out | 307 → `/login?from=…` |
| `curl` `/clinics/nope`, `/some/bad/url` | 404 |
| `curl /api/clinics?area=mars` | 400 `{ error, fieldErrors.area }` |
| `curl /api/slots/bogus`, `/api/appointments` (no cookie) | 404, 401 |
| `.next/prerender-manifest.json` | Eight clinic pages, `initialRevalidateSeconds: 60` |
| `grep` the browser chunks in `.next/static` for the session code, key or store | Nothing |

Then 43 checks in headless Chromium (playwright-core), all passing:

- Signed out, `/appointments`, `/appointments/HK-2PB6Y` and `/book/<slot>`
  redirect to `/login?from=…`; signing in returns to the page asked for.
- Sign-in with `0912` shows the error under the field (`aria-invalid`,
  `role="alert"`); `0911 234 567` signs in and the header says *Sign out 0911 234 567*.
- Choosing Dentistry puts `?specialty=dentistry` in the URL and narrows 8
  clinics to 2; Dermatology in Piassa shows the empty state.
- **Booking end to end:** a day tab is pressed, a time opens `/book/<slot>`
  with the phone pre-filled; an empty submit shows three errors and focuses
  the name; `0812 345 678` shows the phone error and stays on the page; a valid
  form lands on `/appointments/HK-…?booked=1` with the reference. The cached
  clinic page stops offering that slot at once (`revalidatePath`), and its
  `/book` page says it has been taken.
- Cancelling your own booking works, and the slot is offered again.
- **Cancelling someone else's through the action:** on our own booking's page
  the hidden `appointmentId` was changed to `HK-2PB6Y` (another user's) and the
  form submitted — the action answers *You can only cancel your own bookings*;
  `HK-2PB6Y` is still booked when its owner signs in.
- **The same through the route handler:** `DELETE /api/appointments/HK-2PB6Y`
  with our cookie → 403; without a cookie → 401; unknown id → 404; a cookie
  edited to the other user's number → 401 (signature fails).
- `POST /api/appointments` with phone `0912` → 422 `fieldErrors.phone`; valid →
  201 with `Location`; the same slot again → 409; `DELETE` it → 200 cancelled.
- Not found: `/appointments/HK-NOPE1`, someone else's `/appointments/HK-2PB6Y`,
  `/book/not-a-slot`, `/clinics/nope`, `/nowhere` all show *Nothing at this
  address* with a 404 status.
- `/clinics?specialty=paediatrics&fail=1` shows the clinics `error.js` with the
  header still there; **Try again** returns to `?specialty=paediatrics` with the list.
- **JavaScript disabled:** sign-in, a server-side phone error beside the field
  (with the other values kept), and a complete booking all work.
- At 375 px in dark mode there is no horizontal page scroll.
- Console: no errors except the deliberate `?fail=1` (React #441 — production
  withholds the server's message) and the 404s above.
