# Rendering strategy — Hakim

Two questions for every route: **does it depend on who is asking**, and **how
stale may it be**? The marker is what `npm run build` prints (Next.js 16.4.2,
`cacheComponents` off): ○ static, ● prerendered from `generateStaticParams`,
ƒ rendered per request.

| Route | Strategy | Marker | Why, in one line |
| --- | --- | --- | --- |
| `/` | Static | ○ | The specialties and areas only change with a deploy, and nobody's home page differs from anybody else's. |
| `/clinics` | Dynamic | ƒ | It reads `searchParams` (the filters are the request) and each card's "soonest open slot" moves with every booking and with the clock. |
| `/clinics/[clinicId]` | Static from params + ISR, `revalidate = 60`, `dynamicParams = false` | ● | Every clinic id is known at build; the page is the same for everyone; open times may be a minute old because `/book` re-checks the slot — and booking or cancelling calls `revalidatePath` so it is usually fresher than that. Unknown ids are a true 404. |
| `/login` | Dynamic | ƒ | It reads `?from=` and the session cookie (to say "already signed in"). |
| `/book/[slotId]` | Dynamic (`(account)` layout: `force-dynamic`) | ƒ | Per user (`cookies()` in `requireUser`) and "is this slot still free?" must be answered now, not at build time. |
| `/appointments` | Dynamic (`force-dynamic`) | ƒ | One person's bookings, read with their cookie. |
| `/appointments/[appointmentId]` | Dynamic (`force-dynamic`) | ƒ | Same, and it must refuse somebody else's booking per request. |
| `/_not-found` | Static | ○ | Built once; it prints nothing request-specific on purpose. |
| `GET /api/clinics` | Dynamic | ƒ | Reads `request.url` for the filters; soonest slots are live. |
| `GET /api/slots/[slotId]` | Dynamic | ƒ | "Is it free?" is only useful if it is current. |
| `GET/POST /api/appointments` | Dynamic | ƒ | Reads the session cookie; POST is never cached anyway. |
| `GET/DELETE /api/appointments/[appointmentId]` | Dynamic | ƒ | Reads the session cookie; DELETE is never cached. |
| `GET /api/session` | Dynamic | ƒ | It *is* the cookie, read for the header. |

## Decisions worth explaining

- **The root layout reads no cookie.** The header needs to know who is signed
  in, and the obvious place to ask is `app/layout.js` — which would turn `/`
  and every clinic page into ƒ. Instead the header's client `AuthProvider`
  calls `GET /api/session` after the page arrives. Cost: "Sign in" / "Sign out"
  appears a moment after the rest of the header.
- **`/clinics` changed my mind.** First plan: ISR with the filtering done in
  the browser, like Addis Eats' menu. But the brief wants the filters in the
  URL for a page that *loads* filtered when shared, and the "soonest open slot"
  is booking data — so it is ƒ, with the filter bar sent first and the list
  streamed behind a Suspense skeleton.
- **The clinic page is cached although it shows slots.** Being 60 s stale is
  harmless: the slot links go to `/book/[slotId]`, which is dynamic and checks
  the slot again, and the store refuses a second booking of a held slot.
- **`(account)/layout.js` says `force-dynamic` once** for the three signed-in
  routes, rather than leaving each to become dynamic by accident through
  `cookies()`. The marker would be ƒ either way; the export makes the intent
  explicit.

## Checked against the build

Every row above matches the build output pasted in [README.md](README.md#build-output);
`.next/prerender-manifest.json` lists the eight `/clinics/[clinicId]` pages
with `initialRevalidateSeconds: 60` and `/` with `false` (never).
