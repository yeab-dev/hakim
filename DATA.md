# Data fetching — Hakim

Day 45's rule decides almost every row: **on the server, unless the person
triggers it or it must keep refreshing on its own.** Three queries break that
rule, and they run on the client through SWR (Day 41). SWR, not TanStack
Query, because the client side is a poll, a search and the header. That is
mostly reading with one write (cancel), and the smaller library is enough.

Every client query uses the one fetcher in [lib/fetcher.js](lib/fetcher.js),
which throws on a non-OK response, so a 401 or 404 shows up as SWR's `error`
and is never treated as data.

## Decision two: where each piece of data is fetched

| Data | Where, and why |
| --- | --- |
| Specialties, areas | Server, at build time: they change only with a deploy. |
| Clinic list with soonest slot | Server, per request: it comes from the URL filters and changes with every booking. |
| One clinic, its doctors and slots | Server, ISR: public, indexable, the same for everyone. |
| A slot on `/book` | Server, per request: "is it still free?" has to be answered now. |
| My appointments (list) | Server, per request: private, scoped to the session. |
| One appointment's status and queue | **Server first, then polled on the client**: it changes on its own when reception checks someone in. |
| Clinic or doctor search | **Client**: it is triggered by typing, and debounced. |
| Who is signed in (header) | **Client**: reading the cookie in the root layout would make every page dynamic. |
| Reception's list for today | Server, per request: private to one clinic's staff. |

## Every query

| # | Query | Server or client | Key | Refresh rule | Reasoning |
| --- | --- | --- | --- | --- | --- |
| 1 | `getSpecialties()`, `getAreas()` (`lib/data.js`) | Server (build) | — | Only on a new deploy (`/` is ○) | JSON bundled at build time, and nobody's home page differs from anyone else's. |
| 2 | `listClinics({ specialty, area })` on `/clinics` | Server, per request (ƒ) | The URL: `?specialty=&area=` | Every request, streamed behind `<Suspense>` | The filters are the request, and "soonest open slot" moves with each booking and with the clock. |
| 3 | `getClinic(id)` on `/clinics/[clinicId]` | Server, ISR (●) | The path | `revalidate = 60`, plus `revalidatePath` after any booking, cancel or check-in | Public and the same for everyone. A slot up to a minute stale is safe because `/book` checks it again. |
| 4 | `getSlot(id)` on `/book/[slotId]` | Server, per request | The path | Every request | A taken slot must be refused when the page opens, before anyone fills in the form. |
| 5 | `appointmentsFor(session.userId)` on `/appointments` | Server, per request | `session.userId` and `?page=` | Every request; `revalidatePath("/appointments")` after writes | Private. The scope comes from the session and never from the request. "Past and cancelled" is paged five at a time, with the page number in the query string so a page can be linked to. |
| 6 | `appointmentFor(session.userId, id)` on `/appointments/[id]` | Server, per request | `session.userId` and the path | Every request | The first paint, and the **seed** for query 7. Someone else's id returns `null`, which becomes a 404. |
| 7 | `useSWR("/api/appointments/<id>")` in `LiveStatus` and `CancelForm` | **Client** | `/api/appointments/<id>` | `fallbackData` from query 6. `refreshInterval` is **10 s while the booking is `booked` and today or later**, and **0** once it is checked in, cancelled or past. `revalidateOnMount: false`. `mutate()` runs after a cancel | Reception checks people in at a human pace, so 10 s is fresh enough to watch the queue and costs one small request per open tab. The two components share one key, so one request serves both. Polling stops when nothing can change. |
| 8 | `useSWR(term ? "/api/search?q=<term>" : null)` in `ClinicSearch` | **Client** | `/api/search?q=<debounced term>` | Debounced 300 ms; **`null` key under two characters**; `keepPreviousData: true`; `revalidateOnFocus: false` | Typing is what triggers it, so it cannot run on the server. Names change only with a deploy, so focus revalidation would be wasted. `keepPreviousData` keeps the list from flashing empty between searches. |
| 9 | `useSWR("/api/session")` in `AuthProvider` | **Client** | `/api/session` | SWR defaults (on focus and reconnect), plus `mutate()` on every route change; `dedupingInterval: 2000` | Header display only. Keeping the cookie read out of the root layout keeps `/` and the clinic pages static. Every real decision is made again on the server. |
| 10 | `clinicToday(session.clinicId)` on `/reception` | Server, per request | `session.clinicId` | Every request; `revalidatePath("/reception")` after a check-in or cancel | Private to one clinic's staff, and scoped by the account's clinic, never by a URL. It is **not** polled: the receptionist makes the changes themselves, and a booking made for today is a reload away. We chose not to add a second poll. |
| 11 | `getSession()` (`lib/session.js`) | Server | The session cookie (a token, looked up by its SHA-256) | Every call; `cache()` dedupes it within one request | Every page, action and handler gets "who is asking" from here. See [AUTH.md](AUTH.md). |
| 12 | `generateMetadata`, `opengraph-image`, `sitemap.js` | Server | The path, or none | Same as the route they belong to. `sitemap.xml` is built once (○) | Built from the same records the pages render (Day 44). |

## What the network tab shows

Against `npm run start` (see README, "Verified"):

- **Typing "hanna" in the search box** (five keystrokes, 60 ms apart) sends
  **one** request, `GET /api/search?q=hanna`, after the pause. Clearing the
  box sends **none**, because of the null key.
- **Opening an appointment** sends **no** request for it. The status is in
  the server HTML. About 10 s later the first `GET /api/appointments/<id>`
  goes out, then one every 10 s. When reception marks the patient arrived,
  the next poll shows "Checked in", the cancel button goes away, and **no
  further requests** are sent (0 in the following 12 s).
- **Header:** one `GET /api/session` per navigation.
