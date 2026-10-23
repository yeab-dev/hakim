# Hakim — book a clinic appointment in Addis Ababa

CodeOps · Module 3 capstone. Started Day 35 (React + Vite); on Next.js 16
(App Router) since Days 36–40; accounts, live data, a measured performance
pass and metadata since Days 41–45.

The week-9 documents: [AUTH.md](AUTH.md) (who may see what, the layers
protecting each route, the three attacks), [DATA.md](DATA.md) (every query:
server or client, key, refresh rule) and [PERF.md](PERF.md) (the
performance budget, before and after). Week 8's documents are
[STRATEGY.md](STRATEGY.md) (rendering per route) and
[BOUNDARY.md](BOUNDARY.md) (server or client per file).

**Live URL: not deployed yet.** See [Deployment](#deployment).

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
- See all of your bookings, open one, and cancel it. On the day, the
  booking's page shows how many patients are ahead of you and updates by
  itself when reception checks you in.
- Search clinics and doctors by name as you type.
- An account (mobile number and password) protects booking and your
  appointments; browsing is open to anyone.
- Added on Day 42, kept small: a **reception** account for each clinic,
  which sees that clinic's bookings for today and marks patients as arrived.

**Out of scope**, on purpose: the rest of the clinic's side (managing
doctors and schedules), payments, SMS reminders and verification, password
reset, ratings and reviews. Each would be a project of its own.

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

Supporting screens complete the map: **Sign in**, **Create an account**,
**Reception** (staff only: today's bookings at their own clinic), and **Not
found** for any address that does not exist.


## Route map

| Path | Screen | Parameters | Who | File |
| --- | --- | --- | --- | --- |
| `/` | Home | — | Everyone | `app/page.js` |
| `/clinics` | Clinics | `?specialty=` `?area=` (query) | Everyone | `app/clinics/page.js` (+ `loading.js`, `error.js`) |
| `/clinics/:clinicId` | Clinic | `clinicId` | Everyone | `app/clinics/[clinicId]/page.js` |
| `/book/:slotId` | Book | `slotId` | **Signed in** | `app/(account)/book/[slotId]/page.js` |
| `/appointments` | My appointments | `?page=` (past bookings) | **The owner** | `app/(account)/appointments/page.js` |
| `/appointments/:appointmentId` | Appointment | `appointmentId` | **The owner** | `app/(account)/appointments/[appointmentId]/page.js` |
| `/reception` | Reception | — | **Reception staff** | `app/reception/page.js` |
| `/login` | Sign in | `?next=` (where to return) | Everyone | `app/login/page.js` |
| `/signup` | Create an account | `?next=` | Everyone | `app/signup/page.js` |
| `*` | Not found | — | Everyone | `app/not-found.js` |
| `/sitemap.xml`, `/robots.txt` | — | — | Crawlers | `app/sitemap.js`, `app/robots.js` |
| `/opengraph-image`, `/clinics/:clinicId/opengraph-image` | Preview cards (1200×630 PNG) | — | Link previews | `app/opengraph-image.js`, `app/clinics/[clinicId]/opengraph-image.js` |

Private routes are guarded three times: [proxy.js](proxy.js) (Next.js 16's
name for the course's `middleware.js`) redirects a visitor with no session
cookie to `/login?next=<where they were going>`. The page then verifies the
session itself, and every action checks it again. The full table, with what
each layer proves, is in [AUTH.md](AUTH.md). `?next=` is checked by
`safeReturnPath()` in the page and in the action, so the sign-in page cannot
be used as an open redirect. (Days 36–40 called this parameter `?from=`.)

## The plan

### Component tree, with ownership

S = server component, C = client component (`"use client"`).

```
proxy.js                       before /appointments, /book, /reception: is there a session cookie?
app/layout.js (S)              html, header, footer, metadataBase + title template — reads no cookie
└─ Providers (C)               AuthProvider: useSWR("/api/session"), for the header
   ├─ NavTabs (C)              usePathname; a Reception tab for reception accounts (display only)
   ├─ AuthMenu (C)             Sign in / Sign out, in a box of reserved size
   ├─ page.js — Home (S)       specialties + areas, from the build
   ├─ clinics/page.js (S)      reads searchParams; generateMetadata + canonical from the same filters
   │  ├─ ClinicSearch (C)      owns: the search term — debounced useSWR("/api/search?q=")
   │  ├─ FilterBar (S)         a GET <Form>; the URL is its state
   │  └─ <Suspense>
   │     └─ ClinicList (S)     awaits listClinics()
   │        └─ ClinicCard (S)  props: clinic
   ├─ clinics/[clinicId] (S)   awaits getClinic(id); generateMetadata; JSON-LD from the same record
   │  ├─ DoctorSlots (C)       props: week — owns: selected day
   │  └─ opengraph-image (S)   the clinic's preview card
   ├─ login/page.js (S)        reads ?next= and the session
   │  └─ LoginForm (C)         action: signIn
   ├─ signup/page.js (S)
   │  └─ SignUpForm (C)        action: signUp
   ├─ (account)/layout.js (S)  sub-nav; force-dynamic; noindex
   │  ├─ book/[slotId] (S)     requireSession, awaits getSlot(id)
   │  │  └─ BookingForm (C)    owns: values, touched — action: bookAppointment
   │  ├─ appointments (S)      requireSession, appointmentsFor(session.userId), ?page=
   │  └─ appointments/[id] (S) requireSession, appointmentFor(session.userId, id)
   │     ├─ LiveStatus (C)     useSWR seeded with the server's record, polled while it can change
   │     └─ CancelForm (C)     the same SWR key — action: cancelAppointment
   ├─ reception/page.js (S)    requireRole("reception"), clinicToday(session.clinicId)
   │  └─ CheckInForm (C)       action: checkInAppointment
   ├─ error.js / clinics/error.js (C)
   └─ not-found.js (S)
```

See [BOUNDARY.md](BOUNDARY.md) for the one-line reason behind every
component's side.

### Where state lives

| State | Where | Why |
| --- | --- | --- |
| Specialty and area filters | The URL query string | Shareable, survives a refresh and the back button, and has its own canonical URL |
| Page of past bookings | The URL (`?page=`) | A page can be linked to and works without JavaScript |
| Search term | `ClinicSearch` (debounced) | Only that box reads it. The results are an SWR cache entry |
| Clinics, doctors, slots | Read on the server by the page that shows them | Server data, with no endpoint or effect in between |
| Which day is open in a doctor's slots | `DoctorSlots` | Only that component reads or changes it |
| The booking, sign-in and sign-up forms | Their own components | Local, short-lived, discarded on success |
| Session | An httpOnly cookie holding a random token, and a server-side row in `.data/sessions.json` | The server decides who may do what. Sign-out revokes the session |
| "Who is signed in" for the header | SWR key `/api/session`, behind `useAuth` | Display only; fetched from the browser so the root layout stays static |
| One appointment's live status | SWR key `/api/appointments/<id>`, seeded by the server | It changes on its own (reception check-in), so it is polled |
| The user's appointments | Read on the server, scoped to `session.userId` | Server data, not a global store |

### Folders

```
proxy.js             runs before the private routes (Next.js 16's middleware)
app/                 routes only: page, layout, loading, error, not-found, route, opengraph-image, sitemap, robots
  actions.js         the six server actions
  providers.jsx      every provider, in one client file
  clinics/           Clinics, ClinicSearch, FilterBar, ClinicList, ClinicCard (not routes)
    [clinicId]/      Clinic, DoctorSlots, its opengraph-image
  login/ signup/     Sign in, Create an account
  (account)/         the signed-in screens
  reception/         staff screen, CheckInForm
  api/               route handlers
auth/                AuthProvider (SWR), AuthContext, useAuth
components/          shared by more than one route: Field, NavTabs, AuthMenu, SlotSummary
hooks/               useDebouncedValue
lib/                 data, store, files, accounts, password, session, schema, slots, clock,
                     fetcher (client), site (URLs + metadata defaults), jsonld, og
data/                JSON seed: clinics, doctors, specialties, areas, appointments, accounts
```

### Build order — vertical slices

1. Routes and Layout: every screen reachable, even if empty. **(Day 35)** ✓
2. Clinics: fetch, loading, empty, error, list, then the URL filters. ✓
3. Clinic: one clinic by id, its doctors and slots. ✓
4. Sign-in and the guard. ✓
5. Book: the validated form, submitting state, failure path. ✓
6. Appointments: list, detail, cancel. ✓
7. Error boundaries, streaming, polish, on Next.js. **(Days 36–40)** ✓
8. Accounts, sessions, the three layers, scoped queries, then the attacks. **(Day 42)** ✓
9. The polled appointment status and the debounced search, both seeded. **(Day 41)** ✓
10. Lighthouse baseline, then the optimisation pass. **(Day 43)** ✓
11. Metadata, preview cards, JSON-LD, sitemap, robots. **(Day 44)** ✓
12. The three documents and the six-row check. **(Day 45)** ✓

Steps 8–12 follow Day 45's order of work (security first, then measure,
then polish), which is why Day 42's work came before Day 41's.

### Data

There is no mock API: the pages are server components and read
[lib/data.js](lib/data.js) directly.

- **Clinics, doctors, specialties, areas** are JSON in [data/](data/),
  bundled at build time. Each doctor has a weekly schedule ("Mon, Wed, Fri,
  14:00–17:00, every 30 minutes").
- **Slots are never stored.** [lib/slots.js](lib/slots.js) works out the
  next seven days from each schedule, relative to today in Addis Ababa
  (UTC+3), and drops times that have passed or are held by a booking. A slot
  id carries the doctor, date and time (`dr-hanna-tesfaye--20261024-0930`).
- **Three things are written**: bookings, accounts and sessions, each a JSON
  file in `.data/` (git-ignored) through [lib/files.js](lib/files.js). Until
  the first write, the seeds in `data/appointments.json` and
  `data/accounts.json` are used. Bookings are laid out relative to today, so
  there is always a queue at Selam Family Clinic today, plus upcoming, past,
  checked-in and cancelled examples. **Delete `.data/` to reset.**
- `/clinics?fail=1` makes the list read throw (to show `error.js`), and
  `/clinics?slow=1` adds a 700 ms delay (to show the skeleton). Before Day 43
  every visitor paid that delay.

**Limitation, on purpose:** the files live on one server's disk, with a lock
inside one Node process. That is right for `next start` on one machine and
wrong for a serverless host (read-only or throw-away disk) or for more than
one server. A database replaces `lib/files.js`, and its callers do not
change. This is the main item on the deployment checklist below.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: SITE_URL, see below
npm run build                # prints the route table below
npm run start -- -p 3350     # or plain `npm run start` for port 3000
npm run dev                  # for development only; never measure it
npm run lint
```

### Environment

| Variable | Needed | What it does |
| --- | --- | --- |
| `SITE_URL` | In production | The public origin, with no trailing slash, for `metadataBase` (absolute `og:image` and canonical URLs), `sitemap.xml` and `robots.txt`. It is read at build time, so rebuild after changing it. It defaults to the placeholder `https://hakim.example`, because the production URL is pending deployment. |

That is the whole list, and [.env.example](.env.example) documents it.
There is **no secret**: sessions are looked up server-side, so nothing is
signed. Nothing is `NEXT_PUBLIC_`: no browser code needs the site's URL.
`.env*.local` files are git-ignored.

### Demo accounts

Seeded in [data/accounts.json](data/accounts.json). Only scrypt hashes are
stored there; the passwords are these:

| Account | Mobile | Password | Role | Use it to see |
| --- | --- | --- | --- | --- |
| Abebe Kebede | `0911 234 567` | `abebe-demo-2026` | patient | Upcoming, past, checked-in and cancelled bookings, two pages of history, a booking today (`HK-5QD2A`) with two patients ahead |
| Tsion Haile | `0922 765 432` | `tsion-demo-2026` | patient | Owns `HK-2PB6Y`, the booking Abebe must not be able to touch |
| Meseret Alemayehu | `0944 118 820` | `meseret-demo-2026` | patient | — |
| Hirut Bekele | `0930 111 222` | `selam-reception-2026` | **reception**, Selam Family Clinic | `/reception`: mark today's patients arrived, and watch Abebe's `HK-5QD2A` update by itself |

Anyone can also create a patient account at `/signup`.

## Endpoints

Server actions (in [app/actions.js](app/actions.js)) are what the site's own
forms use. The route handlers are for callers outside the site, such as a
mobile app or `curl`, except three that the site's own client queries call:
`/api/session`, `/api/search` and `GET /api/appointments/:id`. Every failure
has one shape: `{ "error": "...", "fieldErrors": { "phone": ["..."] } }`.

| Endpoint | Status codes |
| --- | --- |
| `GET /api/clinics?specialty=&area=` | 200 `{ clinics }` · 400 unknown filter |
| `GET /api/slots/:slotId` | 200 `{ slot }` (with `taken`) · 404 |
| `GET /api/search?q=` | 200 `{ query, clinics, doctors }` (public, `max-age=60`) |
| `GET /api/appointments` | 200 the account's own · 401 |
| `POST /api/appointments` | 201 `{ appointment }` + `Location` · 400 not JSON · 401 · 404 no such slot · 409 already booked · 422 `fieldErrors` |
| `GET /api/appointments/:id` | 200 (with `live`, `queueAhead`) · 401 · 404 (also for someone else's) |
| `DELETE /api/appointments/:id` | 200 cancelled · 401 · 403 someone else's · 404 · 409 started or checked in |
| `GET /api/session` | 200 `{ user: { name, display, role } }` or `{ user: null }` |

| Server action | Checks, inside the action |
| --- | --- |
| `signIn` | Phone and password; scrypt; five failures lock the number for 15 min; `?next=` through `safeReturnPath` |
| `signUp` | Name, phone, password (8+ characters); the number not already registered; role always `patient` |
| `signOut` | Deletes the session row and the cookie |
| `bookAppointment` | Session; the whole form against `lib/schema.js`; slot exists and is free; filed under `session.userId`; then `revalidatePath` |
| `cancelAppointment` | Session; the booking exists **and belongs to the session's account**; not started or checked in |
| `checkInAppointment` | Session; **reception role**; the booking is **at the account's clinic**, today, still booked |

## Build output

`npm run build`, Next.js 16.4.2:

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/appointments
├ ƒ /api/appointments/[appointmentId]
├ ƒ /api/clinics
├ ƒ /api/search
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
├   /clinics/[clinicId]/opengraph-image
│ ├ ● /clinics/selam-family-clinic/opengraph-image
│ ├ ● /clinics/abay-eye-and-skin/opengraph-image
│ ├ ● /clinics/kazanchis-dental-centre/opengraph-image
│ └ ● [+5 more paths]
├ ƒ /login
├ ○ /opengraph-image
├ ƒ /reception
├ ○ /robots.txt
├ ƒ /signup
└ ○ /sitemap.xml


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Each marker matches [STRATEGY.md](STRATEGY.md). The week-8 markers did not
move. Proxy runs only on the three private routes, and `/` and the clinic
pages still read no cookie. This version of Next.js prints no First Load JS
column, so PERF.md measures JavaScript in Lighthouse instead.

## Status

**Days 41–45: the week-9 topics are in the capstone.** The six rows Day 45
asks to be true, each with the evidence behind it:

| Row | Status | Evidence |
| --- | --- | --- |
| Every route reachable on Next.js | ✓ since Day 40, plus `/signup` and `/reception` | Build output above. `curl` returns 200 for every public route, and 307 to `/login?next=` for every private one |
| Layouts and rendering strategy chosen | ✓ since Day 40, markers unchanged | [STRATEGY.md](STRATEGY.md), checked against the build output |
| Server and client boundary documented | ✓ since Day 40, updated for 14 client files | [BOUNDARY.md](BOUNDARY.md) |
| Sign-in and protected routes | ✓ Day 42 | [AUTH.md](AUTH.md). Accounts with scrypt-hashed passwords, a revocable server-side session in an httpOnly/secure/sameSite cookie, `proxy.js` + page + action on every private route, queries scoped to the session, a reception role. **The three attacks were performed and all failed**, each with the line that stopped it |
| One measured optimisation pass | ✓ Day 43 | [PERF.md](PERF.md). Throttled LCP on `/` went from 1.27 to 0.67 s and on `/clinics` from 1.59 to 0.71 s; CLS from 0.026 to 0. First Load JS (152 kB against 120 kB) is **missed**, and PERF.md explains why |
| Metadata on every route | ✓ Day 44 | A title template, a distinct description on every route, `metadataBase`, canonical URLs, a site-wide card and one per clinic, MedicalClinic/Physician JSON-LD, `sitemap.xml`, `robots.txt`. All checked in the served HTML |

Day 41's live data: one **polled** query (the appointment's status and queue
position, seeded with `fallbackData`, polling every 10 s and stopping by
itself) and one **debounced search** (null key under two characters,
`keepPreviousData`). Also a paged list with `?page=` in the URL. All of it
is in [DATA.md](DATA.md).

**The network tab while typing:** typing `hanna` into the search box on
`/clinics` sends **one** request (`/api/search?q=hanna`) after the pause,
not five. Clearing the box sends none. Opening an appointment sends no
request for it at all, because the status is already in the HTML. Polling
begins 10 s later, and stops as soon as reception checks the patient in.

What is still missing, or a stand-in:

- **Not deployed** (see below). The previews, absolute URLs and secure
  cookies were checked on `next start` with the placeholder origin.
- **Storage is JSON files** on one disk (see Data). They must be replaced
  before a serverless deploy.
- There is no SMS verification of the phone number at sign-up, and no
  password reset (AUTH.md, Known limits).
- Times are shown on the 24-hour international clock, not Ethiopian local
  time (Day 47).
- After **Try again** on the `?fail=1` demo, the console logs React error
  #419 twice. React re-renders that Suspense boundary on the client and the
  list appears correctly. It began once the list stopped waiting 700 ms
  (with `?slow=1` it does not happen). Changing the order of `reset()` and
  the navigation did not remove it.

## Verified

On the final build, with `.data/` deleted first (`rm -rf .data .next && npm
run build && npm run start -- -p 3350`):

| Check | Result |
| --- | --- |
| `npm run build` | Passes, with no warnings; routes and markers as above |
| `npm run lint` | No warnings, no errors |
| `curl` `/`, `/clinics`, `/clinics?specialty=dentistry&area=kazanchis`, `/clinics/selam-family-clinic`, `/login`, `/signup`, `/sitemap.xml`, `/robots.txt`, both `opengraph-image`s, `/api/search?q=hanna` | 200 |
| `curl` `/appointments`, `/appointments/HK-4K7QD`, `/book/x`, `/reception` with no cookie | 307 → `/login?next=…` (from proxy) |
| `curl` `/clinics/nope`, `/some/bad/url` | 404 |
| `curl /api/clinics?area=mars`, `/api/slots/bogus`, `/api/appointments` (no cookie) | 400, 404, 401 |
| `grep` of `.next/static` for `scrypt`, `passwordHash`, `createHash`, `randomBytes`, the store file names, the demo passwords, `SITE_URL`, `hakim_session`, `usr_abebe`, `NEXT_PUBLIC` | Nothing: no session, password or store code in any browser chunk |
| The three attacks (AUTH.md) | All refused, each by a named line |
| Lighthouse before and after (PERF.md) | Both columns filled |

Then **95 checks in headless Chromium** (playwright-core), all passing:

- **Guards:** proxy redirects with `?next=`, including the query string
  (`/appointments?page=2`). An invented token of the right shape gets past
  proxy, and the page itself still redirects.
- **Sign-in:** field errors (`aria-invalid`, `role="alert"`); a wrong
  password gives one generic message, and the password is not echoed back;
  sign-in returns to `?next=`. The cookie is httpOnly, Secure, SameSite=Lax,
  with a 7-day lifetime, and `document.cookie` cannot see it. After five
  wrong passwords even the right one is refused for that number.
- **Sign-up:** short password, an already-registered number, success
  returning to `?next=`; the new account's list is empty. **Sign-out
  revokes**: the old token then gets 401.
- **Scoped data:** the list shows only the account's own bookings; another
  account's id is 404 in the URL and the GET handler, and 403 on DELETE;
  the form's hidden id swapped for another account's is refused by the
  action; Tsion's booking survives every attempt.
- **Roles:** a patient on `/reception` gets 404; the Reception tab appears
  only for staff.
- **Open redirect:** `?next=https://example.com`, `//example.com`,
  `/\example.com`, and the hidden field edited by hand, all land on
  `/appointments`.
- **Live data:** the appointment's status and queue position are in the
  server HTML with no request on arrival. Reception marks the patient
  arrived, the patient's open page changes to *Checked in* and loses its
  Cancel button without a reload, and polling then stops.
- **Search:** five keystrokes make one request; an empty box or one
  character makes none; old results stay on screen while the next load.
- **Paging:** `?page=2` shows page 2; `?page=99` falls back to page 1.
- **Earlier flows, unchanged:** URL filters narrow the list and change the
  `h1`; the empty state; booking end to end with validation and focus; the
  ISR clinic page drops a booked slot at once (`revalidatePath`) and offers
  it again after a cancel; route handlers 401/403/404/409/422/201/200;
  not-found pages with a 404 status; the clinics `error.js` and its retry;
  sign-in and booking **with JavaScript disabled**; no horizontal scroll at
  375 px in dark mode.
- **Metadata from the served HTML:** one `h1` per page; a distinct
  description on each of 8 pages; absolute `og:image` URLs; the canonical
  URL drops unknown query parameters; `/login` is noindex with a canonical;
  the JSON-LD `MedicalClinic` name equals the page's `h1`, there is one
  `Physician` per doctor, and the fees match the page; the clinic card is a
  1200×630 PNG; the sitemap lists all 8 clinics and no private route; and
  robots.txt disallows the private routes.
- **Console:** no errors except the deliberate `?fail=1` (React #441), the
  #419 after its retry (above), and the 404 pages' own 404s.

## Deployment

**Live URL: not deployed yet.** No URL has been made up. Day 48 sets up
Vercel. Until then, the checks the course wants run on a deployment (absolute
preview URLs, real cookies over HTTPS) were made against `next start`, with
the placeholder origin.

The build is ready to deploy: `npm run build` and `npm run lint` are clean,
the only variable is documented, and nothing secret is in the repository or
the browser bundle. Before calling it live:

- [ ] **Replace the file store.** `.data/*.json` needs a writable disk that
      lasts, and Vercel's functions have neither. Either move
      `lib/files.js` to a database (accounts, sessions, appointments; the
      callers do not change), or deploy to a single Node host with a
      persistent disk (`npm run build && npm run start`).
- [ ] **Set `SITE_URL`** to the production origin (for example the Vercel
      URL) in the host's environment settings, for Production *and*
      Preview, then **rebuild**. Static pages read it at build time.
- [ ] Check that `/robots.txt` and `/sitemap.xml` show the real origin, and that
      view-source on `/` and `/clinics/selam-family-clinic` shows
      `og:image` and `canonical` on that origin.
- [ ] Open the deployed `/clinics/selam-family-clinic/opengraph-image`
      (1200×630), and paste a clinic link into Telegram or a social
      debugger to see the card.
- [ ] Sign in over HTTPS and confirm in DevTools that `hakim_session` is
      `HttpOnly`, `Secure` and `SameSite=Lax`.
- [ ] Run the three attacks from AUTH.md against the deployed URL.
- [ ] Re-run Lighthouse on the deployment (mobile, throttled) and add it as a
      third column in PERF.md. The numbers there are from `localhost`.
- [ ] Put the live URL at the top of this README.
