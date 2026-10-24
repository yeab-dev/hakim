Hakim — 3 Strengths

1. Clean server/client split
   Server Components fetch data directly, while client components are kept small for forms, search, and polling.
   Server Actions handle mutations with validation and permission checks, so UI components stay simple.
   This makes the code easy to follow and avoids leaking server logic into the browser.
   The pattern is documented in DATA.md and used consistently across the app.

2. Strong auth checks
   Passwords are hashed with scrypt, and sessions use secure httpOnly cookies.
   Auth is checked in the proxy, page, and server action, not just in the UI.
   Sign-out revokes the session server-side, and safeReturnPath prevents open redirects.
   This is more secure than typical frontend-only projects and is clearly explained in AUTH.md.

3. Good rendering choices
   Clinic pages use ISR with revalidate: 60, while filters and booking stay dynamic only where needed.
   Static generation is used for specialties and areas, keeping the homepage fast.
   Lighthouse scores are 99–100, and LCP was reduced to 0.67s.
   This shows deliberate use of Next.js rendering instead of making every page client-side.

Hakim — 3 Alternative Weaknesses

1. No custom 404 or error pages
   When a user visits a wrong clinic ID or a route that fails, they see the default Next.js error screen.
   This looks broken and gives no way back to the app.
   Fix: add app/not-found.js and app/error.js with a short message and a “Back to home” link.
   This is a few lines of code and makes the app feel much more polished.

2. Missing loading.js for route transitions
   Navigating between pages that fetch data shows no feedback until the new page is ready.
   On slower connections, users may click again or think the app is frozen.
   Fix: add simple loading.js files for routes like /clinics and /clinics/[clinicId] with a skeleton or spinner.
   This is a built-in Next.js feature and requires no extra libraries.

3. Accessibility gaps (alt text, labels, focus states)
   Some images likely lack alt text, and form inputs may not have proper <label> associations.
   Focus outlines may be removed without a visible replacement, making keyboard navigation harder.
   Fix: add descriptive alt attributes, associate labels with inputs, and ensure :focus-visible styles are present.
   These are small HTML/CSS changes that improve usability for everyone.
