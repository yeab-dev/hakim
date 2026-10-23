# Performance — Hakim

Measured the way Day 43 asks: **`npm run build && npm run start`**, never
the dev server, with Lighthouse 13.5.0 (mobile, headless Chromium), on
`localhost:3350`, with `.data/` reset first. Every number is the **median of
three runs**. Two throttling methods were used, on the same builds:

- **DevTools throttling** (`--throttling-method=devtools`): the page really
  loads over a throttled link (about 1.6 Mbit/s down, 562 ms round trip) with
  the CPU slowed 4×. This is the course's "Slow 4G, 4× CPU", and it is the
  LCP row of the budget.
- **Simulated** (Lighthouse's default, `simulate`): a fast load, then a model
  that estimates the same throttled conditions. It drives the Lighthouse
  score. It is reported because it is what a default Lighthouse run shows,
  and it tells a different story about LCP (see below).

The **baseline** was taken at commit `357f581`, after the Day 41 and 42
features were finished and before any optimisation (Day 45: "a baseline
taken too early measures a different application"). The **after** column is
the final build, with Day 44's metadata included.

## Decision three: the performance budget

| Measure | Target | Before | After | |
| --- | --- | --- | --- | --- |
| LCP, throttled: `/` | Under 2.5 s | 1.27 s | **0.67 s** | ✓ met, and down 47% |
| LCP, throttled: `/clinics` | Under 2.5 s | 1.59 s | **0.71 s** | ✓ met, and down 55% |
| CLS (every page) | Under 0.1 | 0.026 (0.023 on `/login`) | **0.000** | ✓ met, now zero |
| First Load JS, `/clinics` (compressed transfer) | Under 120 kB | 150.4 kB | 151.8 kB | ✗ **missed** (see below) |
| Largest image | Under 150 kB | 0 kB (no images) | 0 kB (no images) | ✓ met: pages load no images; the preview cards (59–60 kB PNG) are fetched only by link previews |
| Lighthouse performance | 90 or better | 99 (`/clinics`), 98–100 elsewhere | 99–100 | ✓ met |
| TBT, the INP proxy (Lighthouse cannot measure INP on a page load) | Under 200 ms | 93–102 ms | 86–124 ms | ✓ met, unchanged within noise |

### Per page, DevTools throttling (the real load)

| Page | FCP before → after | LCP before → after | CLS before → after | TBT before → after | Score |
| --- | --- | --- | --- | --- | --- |
| `/` | 1.27 → **0.67 s** | 1.27 → **0.67 s** | 0.026 → 0 | 100 → 86 ms | 99 → 100 |
| `/clinics` | 1.25 → **0.71 s** | 1.59 → **0.71 s** | 0.026 → 0 | 101 → 91 ms | 99 → 100 |
| `/clinics/selam-family-clinic` | 1.32 → **0.75 s** | 1.32 → **0.75 s** | 0.026 → 0 | 98 → 92 ms | 99 → 100 |
| `/login` | 1.27 → **0.66 s** | 1.27 → **0.66 s** | 0.023 → 0 | 93 → 93 ms | 99 → 99 |
| `/appointments/HK-4K7QD` (signed in) | 1.27 → **0.77 s** | 1.27 → **0.77 s** | 0.026 → 0 | 102 → 124 ms | 99 → 99 |

### Per page, simulated throttling (Lighthouse's default)

| Page | FCP before → after | LCP before → after | CLS before → after | TBT before → after | Score |
| --- | --- | --- | --- | --- | --- |
| `/` | 0.76 → 0.68 s | 2.00 → 2.07 s | 0.026 → 0 | 41 → 38 ms | 99 → 99 |
| `/clinics` | 0.76 → 0.69 s | 2.02 → 1.66 s | 0.026 → 0 | 63 → 79 ms | 99 → 99 |
| `/clinics/selam-family-clinic` | 0.76 → 0.75 s | 1.66 → 2.28 s | 0.026 → 0 | 59 → 84 ms | 100 → 98 |
| `/login` | 0.76 → 0.67 s | 2.10 → 2.09 s | 0.023 → 0 | 92 → 82 ms | 98 → 99 |
| `/appointments/HK-4K7QD` | 0.78 → 0.78 s | 2.09 → 2.09 s | 0.026 → 0 | 85 → 81 ms | 99 → 99 |

## What caused each change

Each change was measured on its own. A build at `def7b7f` (changes 1 and 2,
but not 3) was measured between the before and after runs:

| # | Change (commit) | What moved, DevTools throttling | Why |
| --- | --- | --- | --- |
| 1 | Reserve the header's sign-in box (`50fd06f`) | **CLS 0.026 → 0** on every page; LCP unchanged (1.27 s on `/`) | The header learns who is signed in from `/api/session` *after* the page arrives. The empty placeholder used to grow into "Sign in", the nav wrapped again on a 412 px phone, and `<main>` moved down. That was the site's only layout shift (the Lighthouse culprit was `main.page`). The box is now a fixed size in all three states. |
| 2 | Make the 700 ms demo delay opt-in, `?slow=1` (`def7b7f`) | **`/clinics` LCP 1.59 → 1.27 s**; other pages unchanged | The list read waited 700 ms so the Day 37 skeleton could be seen. Every real visitor paid for it. Before, the LCP element was a clinic card's "Soonest open slot" line, which painted only after the delay (render delay 1.58 s). Afterwards it is the text above the list. |
| 3 | Inline the stylesheet (`6c4bcdd`, `experimental.inlineCss`) | **FCP and LCP 1.27 → 0.67 s on `/`** (0.71 s `/clinics`, 0.66 s `/login`), on every page | The 2.7 kB stylesheet was the one render-blocking request: the browser had to fetch the HTML, discover the `<link>`, and make a second round trip before painting. On a 562 ms round-trip link that is about 0.6 s. Now the CSS arrives inside the HTML. Trade-off: it is not cached between pages, which costs about 2.7 kB per page. That is fine for a few page views per booking. |
| — | Day 44 metadata, JSON-LD, preview cards | No measurable change; about 1 kB more HTML per page | `<meta>` tags and one JSON-LD `<script>` on clinic pages. The cards are separate URLs. |

**The change that did most of it:** inlining the CSS (change 3) halved LCP
on every page. On `/clinics`, removing the demo delay did a third of the
work first.

### Why the simulated LCP did not come down

In the simulated runs, LCP stays at about 2.0 s while FCP is 0.7 s. The LCP
element on every page is **text**: the home page's lead paragraph, a clinic's
"about" paragraph, the appointment's `h1`. It paints at FCP in the real
throttled load, which is why the DevTools LCP equals FCP after the changes.
The simulation instead counts every request that started before LCP. All of
the page's ~148 kB of JavaScript is requested from the `<head>` before the
text paints, so the model charges its download time to LCP, even though the
scripts are `async` and do not block the paint. The simulated LCP therefore
measures the JavaScript total. Changes 1–3 did not move that total, so the
simulated LCP did not move either, apart from noise (1.66 to 2.28 s on the
clinic page between runs). The DevTools numbers are the honest measure of
what changed. The simulated ones are why the next row matters.

### The missed target: First Load JS

`/clinics` loads **151.8 kB** of compressed JavaScript against a budget of
120 kB. Broken down by chunk (Lighthouse network requests, `/` and `/clinics`):

| Chunk | Compressed | What it is |
| --- | --- | --- |
| React DOM | 70.7 kB | The framework. Present on every Next.js page |
| Next.js router and runtime | 45.7 kB | The framework |
| App shell (providers, header, AuthMenu, NavTabs, prop-types) | 7.8 kB | Ours |
| next/link and next/form | 7.8 kB | Framework components we use |
| SWR | 5.7 kB | Added on Day 41 for the poll, the search and the header |
| Turbopack runtime + small chunks | ~8 kB | |
| ClinicSearch (on `/clinics` only) | 2.6 kB | Ours |

React and Next.js alone are **116 kB**, so 120 kB leaves about 4 kB for the
whole application. The target cannot be met without leaving the framework,
and the course rules out breaking the week-8 architecture to satisfy a new
row. Our own code is about 16 kB (shell, search, SWR), and every page's
content is server-rendered HTML, so none of it waits for this JavaScript.
The next step, if this budget is kept, would be dropping `prop-types` from
client components (React 19 ignores them) and checking whether `next/form`
earns its 3–4 kB over a plain `<form method="get">`.

## The Day 43 checklist

| Item | Here |
| --- | --- |
| Lighthouse before any change, production build, throttled | Above, at `357f581` |
| Every image through `next/image` with width, height, `sizes`, alt | **There are no content images, on purpose.** Hakim's screens are lists of clinics, doctors and times, and no photo would help a patient choose. There are no real photos of these clinics, and stock pictures of strangers would mislead on a medical site. Each image would also cost a phone on mobile data more than the whole page does now. The only images are the Open Graph cards, which only link previews fetch. If clinic photos are added later, they go through `next/image` with `sizes`. |
| `priority` on exactly one image | Not applicable: there is no image above the fold. In Next.js 16, `priority` is **deprecated and renamed `preload`** (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`). |
| `next/font` replacing any font `<link>` | **There was no font link to replace.** The stylesheet uses the system stack (`system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif`), so there are 0 font bytes and no font swap to cause a shift (font transfer: 0 kB before and after). We kept it that way on purpose. A web font would add a request and a swap for no gain in legibility, and the stack already names an Ethiopic fallback for any Amharic text added later. |
| Third-party scripts through `next/script` with a lazy strategy | **There are none**: no analytics, chat widget or map. If one is added, it goes in with `strategy="lazyOnload"`. |
| `.env.example` committed, `.env*.local` git-ignored, no secret `NEXT_PUBLIC_` | Yes. The only variable is `SITE_URL`, which is neither secret nor public. `grep NEXT_PUBLIC_` finds nothing in the source or `.next/static`. |

## How to reproduce

```bash
rm -rf .data && npm run build && npm run start -- -p 3350
CHROME_PATH=/usr/bin/chromium npx lighthouse@13.5.0 http://localhost:3350/clinics \
  --only-categories=performance --throttling-method=devtools \
  --chrome-flags="--headless=new" --output=json --output-path=clinics.json
```

For the signed-in page, add
`--extra-headers='{"Cookie":"hakim_session=<token>"}'` with a token taken
from DevTools after signing in as a demo account.
