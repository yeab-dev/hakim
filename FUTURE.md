# FUTURE: what was cut, and what comes next

## Cut on purpose (out of scope from the brief)

- The clinic side: managing doctors and weekly schedules.
- Payments, and SMS reminders or phone verification.
- Ratings and reviews.

## Started, not finished

- **Reception week dashboard (Day 46).** Bookings per day as a bar chart, with
  the same numbers in a table, and a sortable, paged bookings table. It is
  half-built on the branch `wip/day46-dashboard` and kept off `main` so `main`
  stays working.

## Done since the cut

- **CSV export (Day 47).** *Download my booking history* on My appointments,
  served by `GET /api/appointments/export`, which is scoped to the session (401
  when signed out). Commas, quotes and newlines are quoted per RFC 4180.
  `npm run check:csv` tests it.

## Next

- A Leaflet map on each clinic page, with the address as text beside it (Day 47).
- Live queue status over server-sent events instead of 10-second polling (Day 47).
- A full keyboard-only pass and a 44 px touch-target pass (Day 48).
- A real database. The store is a JSON file in `.data/`, which won't persist on
  a serverless host such as Vercel. This has to happen before a real deployment.
- Deploy, then run the verification battery on the live URL (Days 48–49).

## Known issues

- React logs error #419 twice after "Try again" on the `?fail=1` demo. The
  list still renders. The README's Status section has the details.
- First Load JS on `/clinics` is 151.8 kB against a 120 kB budget. React DOM
  and the Next.js runtime are 116 kB of that.
