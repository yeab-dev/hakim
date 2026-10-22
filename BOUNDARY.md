# Server / client boundary — Hakim

Everything is a server component unless something forces it into the
browser. Ten files carry `"use client"` (`grep -rl '"use client"' app components auth`);
each is a leaf that needs state, an event handler, a browser-only hook, or is
required to be one by Next.js. Nothing below passes a function from a server
component to a client one — the only functions that cross are server actions,
which Next.js sends as references.

## Client (`"use client"`)

| File | Why it must run in the browser |
| --- | --- |
| `app/providers.jsx` | Holds the context providers so `app/layout.js` can stay on the server; receives the pages as `children`, so they stay server-rendered. |
| `auth/AuthProvider.jsx` | State (who is signed in) and an effect that calls `GET /api/session` on each navigation. |
| `components/NavTabs.jsx` | `usePathname()` to highlight the open tab — Next.js has no `NavLink`. |
| `components/AuthMenu.jsx` | Reads `useAuth()`; its sign-out form posts to the `signOut` server action and clears the context on submit. |
| `app/clinics/[clinicId]/DoctorSlots.jsx` | Which day is open — the one piece of state on the clinic page. Gets plain data (dates, labels, slot ids). |
| `app/login/LoginForm.jsx` | `useActionState(signIn)` for errors and pending; checks the phone as you type with `lib/schema.js`. |
| `app/(account)/book/[slotId]/BookingForm.jsx` | Field values, touched fields, focus on the first bad field; `useActionState(bookAppointment)`. |
| `app/(account)/appointments/[appointmentId]/CancelForm.jsx` | The "are you sure?" step and the pending flag; `useActionState(cancelAppointment)`. |
| `app/clinics/error.js` | Required by Next.js: an error boundary is state plus a retry handler (`router.replace` + `reset`). |
| `app/error.js` | Same, for every other segment. |

## Server (no directive)

| File | What it does on the server |
| --- | --- |
| `app/layout.js` | `<html>`, header, footer, metadata. Imports two client leaves and the Providers file; reads no cookie, so routes below may be static. |
| `app/page.js` | Home: specialties and areas from the build. |
| `app/clinics/page.js` | Reads `searchParams`, validates them, renders the filter bar and a Suspense boundary. |
| `app/clinics/FilterBar.jsx` | A GET form (`next/form`) — the URL holds the state, so no client code of its own. |
| `app/clinics/ClinicList.jsx` | **Async server component** that awaits `listClinics()` — the screen whose Vite `useFetch` was deleted; loading is the Suspense fallback, failing is `error.js`. |
| `app/clinics/ClinicCard.jsx`, `ClinicListSkeleton.jsx` | Markup only. |
| `app/clinics/loading.js` | Skeleton while the segment loads. |
| `app/clinics/[clinicId]/page.js` | Awaits `getClinic()`, `notFound()` for an unknown id, `generateStaticParams`. |
| `app/login/page.js` | Reads `?from=` and the session. |
| `app/(account)/layout.js` | Sub-navigation; `dynamic = "force-dynamic"`. |
| `app/(account)/book/[slotId]/page.js` | `requireUser()`, awaits `getSlot()`, `notFound()`; hands the form only the slot id and the phone. |
| `app/(account)/appointments/page.js` | `requireUser()`, awaits the user's bookings. |
| `app/(account)/appointments/[appointmentId]/page.js` | `requireUser()`, awaits the booking *only if it is theirs*, else `notFound()`. |
| `app/not-found.js` | Static not-found screen. |
| `components/Field.jsx`, `components/SlotSummary.jsx` | Markup with no hooks. `Field` is imported by the two client forms, so it is *bundled* into them — but it does not need a directive of its own. |
| `app/actions.js` (`"use server"`) | `signIn`, `signOut`, `bookAppointment`, `cancelAppointment`. Each validates its input with `lib/schema.js` and reads the user from the cookie; cancel checks ownership inside the action. |
| `app/api/**/route.js` | Route handlers — see the README's endpoint table. |
| `lib/data.js`, `lib/store.js`, `lib/session.js`, `lib/booking.js`, `lib/appointments.js` | `import "server-only"`: the build fails if a client file ever imports them. The session's HMAC key lives here and never reaches the browser. |
| `lib/schema.js`, `lib/clock.js`, `lib/slots.js`, `lib/http.js` | Pure modules. `schema.js` is deliberately shared: the forms import it in the browser, the actions and handlers on the server. |

## Composition

`Providers` (client) wraps the whole app and receives every page as
`children` — the "client shell around server content" pattern; the pages are
not imported by it, so none of them is pulled into the bundle. `DoctorSlots`
is rendered inside the server clinic page with only serialisable props.

## Checked

- `grep -rl '"use client"' app components auth` → exactly the ten files above.
- `grep -rlE "createHmac|__hakimSessionKey|appointments.json|userPhone" .next/static`
  → nothing: no session code, key or store data in any browser chunk.
