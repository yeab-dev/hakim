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

- **Touch targets (Day 48).** Every standalone control is at least 44 px,
  measured at 375 px wide; only links inside a sentence are smaller, which
  WCAG 2.5.8 allows. There are no clickable divs, and no horizontal scroll on
  any public page in light or dark mode.

## Next

- A Leaflet map on each clinic page, with the address as text beside it (Day 47).
- Live queue status over server-sent events instead of 10-second polling (Day 47).
- A full keyboard-only pass by hand, mouse out of reach (Day 48).
- A real database with transactions. Upstash Redis stores each collection whole,
  so two simultaneous writes could lose one.
- Lighthouse on the live URL, to replace the local numbers in PERF.md.

## Known issues

- React logs error #419 twice after "Try again" on the `?fail=1` demo. The
  list still renders. The README's Status section has the details.
- First Load JS on `/clinics` is 151.8 kB against a 120 kB budget. React DOM
  and the Next.js runtime are 116 kB of that.
