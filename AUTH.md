# Authentication and authorisation — Hakim

Two questions, answered in different places. **Who is asking?** comes from
the session, through one helper. **May they touch this record?** comes from
the record itself, checked where the write happens.

Next.js 16 note: the course's `middleware.js` is called
[`proxy.js`](proxy.js) here, and it exports `proxy`. Next.js 16 renamed the
file convention and kept the behaviour. It runs on the Node.js runtime by
default.

## Accounts and the session

- **Accounts** ([lib/accounts.js](lib/accounts.js)): phone, name, role and a
  **scrypt** hash of the password ([lib/password.js](lib/password.js),
  `node:crypto`, N=16384, r=8, p=1, a 16-byte salt per account). The password
  itself is never stored. Signing in with an unknown number still runs scrypt
  against a decoy hash, so the response time does not reveal which numbers
  have accounts. Both mistakes get the same message: *That number and
  password do not match an account.* Five wrong passwords for one number in
  15 minutes lock that number for the rest of the window. This counter is in
  memory and per server (see Known limits).
- **Sign-up** (`/signup`, `signUp` action) creates a `patient` account. Any
  other role is seeded and can never be chosen by the person signing up. The
  seed accounts and their demo passwords are listed in the README.
- **The session** ([lib/session.js](lib/session.js)) is a **database
  session**. The cookie `hakim_session` holds a random 32-byte token and
  nothing else. `.data/sessions.json` stores the token's SHA-256, the account
  id and an expiry. Signing out deletes that row, so a copied token stops
  working at once (attack 1c below).
- **Cookie flags**, set in `startSession()`:

  | Flag | Value | Blocks |
  | --- | --- | --- |
  | `httpOnly` | `true` | A script on the page reading the token (checked: `document.cookie` does not show it) |
  | `secure` | `true` in production | Sending it over plain HTTP. Browsers treat `localhost` as secure, so `next start` still works locally |
  | `sameSite` | `lax` | Sending it on another site's POST, so another site cannot act as the user |
  | `maxAge` | 7 days | A session that lives for ever (the server-side row expires at the same moment) |
  | `path` | `/` | — |

- **One helper:** `getSession()` returns `{ userId, name, phone, display,
  role, clinicId }` or `null`, and is wrapped in React's `cache()`. Every
  page, server action and route handler gets the session from it. Nothing
  else reads the cookie, except proxy.js, which only checks its shape.

## Decision one: who may see what

| Route | Who | Protected by | What that proves |
| --- | --- | --- | --- |
| `/`, `/clinics`, `/clinics/[clinicId]` | Everyone | Nothing | They are public and should stay indexable (they are in the sitemap). |
| `/login`, `/signup` | Everyone | Nothing (they read `?next=`, which `safeReturnPath` checks) | — |
| `/book/[slotId]` | Any signed-in account | proxy + page | Signed in. The `bookAppointment` action checks the rest: session, the form, and a free slot. The booking is filed under `session.userId`. |
| `/appointments` | The owner | proxy + page + scoped query | Signed in, and only their own records: `appointmentsFor(session.userId)`. |
| `/appointments/[appointmentId]` | The owner | proxy + page + scoped query + action | Signed in, and only their own record. Another account's id gets a **404**, the same as an id that does not exist. `cancelAppointment` checks ownership again. |
| `/reception` | Reception staff, own clinic | proxy + page with role check + query scoped to the account's clinic + a role and clinic check in the action | Signed in, permitted (the `reception` role), and only for their own clinic, today. |
| `/api/appointments`, `/api/appointments/[id]` | The owner | The handler: session, then ownership | 401 without a session; GET of someone else's booking is 404; DELETE of someone else's is 403. |
| `/api/clinics`, `/api/slots/[id]`, `/api/search` | Everyone | Nothing | Public data only. |
| `/api/session` | Anyone (answers about themselves) | — | Returns name, number and role for the header to show. It grants nothing. |

### Each protected route, one line per layer

```
/appointments
  proxy   -> a hakim_session cookie of the right shape exists          proxy.js:14
  page    -> session verified (row found, not expired, account exists) app/(account)/appointments/page.js:24  requireSession()
  query   -> appointmentsFor(session.userId)                           lib/store.js listAppointmentsFor(userId)
  (no writes on this page)

/appointments/[appointmentId]
  proxy   -> cookie of the right shape exists                          proxy.js:14
  page    -> session verified                                          app/(account)/appointments/[appointmentId]/page.js:19
  query   -> appointmentFor(session.userId, id): null unless owner     lib/appointments.js:52  -> notFound()
  poll    -> GET /api/appointments/:id re-checks session + owner       app/api/appointments/[appointmentId]/route.js:12
  action  -> cancelAppointment: session, then ownership                app/actions.js:99, lib/appointments.js:72

/book/[slotId]
  proxy   -> cookie of the right shape exists                          proxy.js:14
  page    -> session verified                                          app/(account)/book/[slotId]/page.js:19
  action  -> bookAppointment: session, schema, slot free;              app/actions.js:68
             filed under session.userId                                lib/booking.js
                                                                       (never a value from the form)

/reception
  proxy   -> cookie of the right shape exists                          proxy.js:14
  page    -> session verified AND role === "reception", else 404       app/reception/page.js:22  requireRole()
  query   -> clinicToday(session.clinicId)                             lib/appointments.js clinicToday
  action  -> checkInAppointment: session, role, clinic, today          app/actions.js:125-126, lib/appointments.js:84
```

### Every server action

| Action | Who may call it | Checked inside the action |
| --- | --- | --- |
| `signIn` | Anyone | Phone and password parsed with `lib/schema.js`; credentials checked with scrypt; lock after 5 failures; `?next=` passed through `safeReturnPath` (`app/actions.js:40`). |
| `signUp` | Anyone | Name, phone and password parsed; the number must be free (checked in the same locked step as the write); the role is always `patient`; `?next=` checked. |
| `signOut` | Anyone | Deletes the session row and the cookie. |
| `bookAppointment` | Signed in | Session (`:68`); the whole form against the same schema as the browser; slot exists and is free; filed under `session.userId`. |
| `cancelAppointment` | The owner | Session (`:99`), then `checkCancel(session.userId, id)`: the booking exists **and** `a.userId === session.userId` (`lib/appointments.js:72`); not started or checked in. |
| `checkInAppointment` | Reception, own clinic | Session (`:125`), role (`:126`), then `checkArrive`: `a.clinicId === session.clinicId` (`lib/appointments.js:84`), dated today, still booked. |

Hiding a button is never the protection. The Cancel button exists only on your
own bookings and the Reception tab only for reception accounts, but the attacks
below call the actions directly, with no button involved.

## The three attacks — performed

Run against `npm run build && npm run start -p 3350`, `.data/` deleted first
(last run on the final build).
The script is a headless Chromium session (playwright-core), and every call
below is the same `fetch` you would type into DevTools. To get an action's id,
press the real button once and copy the `Next-Action` request header from the
Network tab. The id changes with every build: on the final build,
`cancelAppointment` was `60c7bd4f…` and `checkInAppointment` was `601ab001…`.

```js
// in the DevTools console, on any page of the site
const fd = new FormData();
fd.append("_1_appointmentId", "HK-4K7QD");      // the action's formData argument
fd.append("0", '[null,"$K1"]');                 // (previousState, formData)
await fetch("/", { method: "POST", headers: { "Next-Action": "60c7bd4f…" }, body: fd })
  .then((r) => r.text());
```

### 1 — `cancelAppointment` called while signed out

| Variant | What happened | What stopped it |
| --- | --- | --- |
| a. No cookie at all | `{}` came back and nothing ran. Posting to `/appointments/HK-4K7QD` itself gave a 307 to `/login?next=…` | **proxy.js:14.** Next.js forwards an action to a page that bundles it, here `/appointments/[appointmentId]`. Proxy guards that path, so the forwarded call was redirected before the action ran. |
| b. A cookie invented in the console: `document.cookie = "hakim_session=" + "A".repeat(43)`. A script cannot *read* the real httpOnly cookie, but it can *set* one of the right shape | Proxy let it through, as designed. The action answered **"Sign in first: your session has ended or you are signed out."** `checkInAppointment` gave the same answer | **app/actions.js:99** (`:125` for check-in): `getSession()` found no session row for that token. |
| c. A real token, replayed after its owner pressed Sign out | **"Sign in first…"** | **app/actions.js:99.** Sign-out deleted the session row (`endSession`, lib/session.js), so the old token matches nothing. A signed token (JWT) would still have worked here. |

Afterwards `HK-4K7QD` still read **Booked**.

### 2 — Signed in as one account, using another account's id

Signed in as Abebe (`0911 234 567`). `HK-2PB6Y` belongs to Tsion (`0922 765 432`).

| Attempt | Result | Line that refused it |
| --- | --- | --- |
| `cancelAppointment` with `HK-2PB6Y`, from the console | **"You can only cancel your own bookings."** The server log shows `cancelAppointment refused (forbidden) for usr_abebe: HK-2PB6Y` | **lib/appointments.js:72**, `if (a.userId !== userId) return { outcome: "forbidden" }`. It is refused on **ownership**, not on the session (the session was valid). Answered at app/actions.js:102. |
| Open `/appointments/HK-2PB6Y` (changing the id in the URL) | **404**, *Nothing at this address* | **lib/appointments.js:52**. The query is scoped to `session.userId`, so another account's id returns `null`, which becomes `notFound()`. |
| `GET /api/appointments/HK-2PB6Y` with Abebe's cookie | **404** `{"error":"No such appointment"}` | The same scoped query. |
| `DELETE /api/appointments/HK-2PB6Y` with Abebe's cookie | **403** `{"error":"You can only cancel your own bookings"}` | lib/appointments.js:72, answered at app/api/appointments/[appointmentId]/route.js:34. |
| Abebe (a patient) calls `checkInAppointment` on his own booking | **"Only clinic reception can check patients in."** | **app/actions.js:126**, the role check. |
| Abebe opens `/reception` | **404** | `requireRole()` → `notFound()` (lib/session.js). |
| Hirut (Selam Family Clinic reception) calls `checkInAppointment` with `HK-2PB6Y`, a Kazanchis Dental booking | **"That booking is not on your clinic's list for today."** Logged as `refused (forbidden)` | **lib/appointments.js:84**, `a.clinicId !== session.clinicId`. |

Afterwards Tsion signed in and `HK-2PB6Y` still read **Booked**.

### 3 — A crafted sign-in link

Each link was opened, then the account signed in with the correct password:

| Link | Hidden `next` on the form | Landed on |
| --- | --- | --- |
| `/login?next=https://example.com` | `/appointments` | `http://localhost:3350/appointments` |
| `/login?next=//example.com` | `/appointments` | `/appointments` |
| `/login?next=/\example.com` | `/appointments` | `/appointments` |
| `/login?next=javascript:alert(1)` | `/appointments` | `/appointments` |
| `/login?next=/%5Cexample.com` | `/%5Cexample.com` | `/%5Cexample.com`: a path *on this site* (it shows the 404 page). The encoded backslash stays encoded and never leaves the origin. |
| `/login`, then the hidden `next` field edited to `https://example.com` in DevTools before submitting | — | `/appointments` |

**What stopped it:** `safeReturnPath()` at **lib/schema.js:179**. The path
must start with exactly one `/` and contain no backslash or whitespace, and
then `new URL(next, "http://hakim.invalid").origin` must still be that dummy
origin (line 184). The login page applies it to what it puts in the form. The
`signIn` action applies it again at **app/actions.js:40**, which is why
editing the hidden field changes nothing. The fallback is the person's home
(`/appointments`, or `/reception` for staff) rather than `/`.

## The course's six mistakes, audited

| Mistake | Here |
| --- | --- |
| Only middleware protects it | Proxy only checks the cookie's shape. Every page calls `requireSession`/`requireRole`, and every writing action calls `getSession` (attack 1b gets past proxy and is still refused). |
| Trusting an id from the client | Ids from the client are treated as claims. Reads are scoped by `session.userId` or `session.clinicId`, and writes compare the record's owner or clinic with the session (attack 2). |
| Checking auth in a client component | `useAuth()` is display only: the header text and the Reception tab. |
| A token in localStorage | The token lives only in an httpOnly cookie. |
| Redirecting to an unchecked URL | `safeReturnPath`, in both the page and the action (attack 3). |
| `NEXT_PUBLIC` on a secret | There are no secrets in the environment at all now, and `SITE_URL` is not public either. `grep` of `.next/static` finds no session, hash or store code (README, Verified). |

## Known limits

- Accounts, sessions and bookings are JSON files on one server's disk (see
  `lib/files.js`). The sign-in lock is in memory and per process. A database
  and a shared rate limiter replace both, and the callers do not change.
- There is no password reset and no phone verification by SMS. Anyone can
  sign up with any number they type. A production version would send a code
  to the number before creating the account.
- Server actions keep Next.js's built-in CSRF check (the `Origin` header must
  match the host) on top of `sameSite=lax`.
