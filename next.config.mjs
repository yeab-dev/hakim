/** @type {import('next').NextConfig} */
const nextConfig = {
  // There is a pnpm-workspace.yaml in a parent folder; without this Next.js
  // warns on every build that it is looking outside the project.
  turbopack: { root: import.meta.dirname },

  // Day 43: the one stylesheet (about 2.7 kB compressed) goes into the HTML as
  // a <style> instead of a render-blocking <link>, saving a round trip before
  // first paint on a slow phone connection. The trade-off: it is no longer
  // cached between pages. With one small file and mostly first-time visitors
  // (a booking is a few page views), that is the right way round. Experimental
  // in Next.js 16; measured in PERF.md.
  experimental: { inlineCss: true },

  // create-next-app 16.4 switches on `cacheComponents` and
  // `partialPrefetching`. Both replace the route segment options Days 36–40
  // teach (`revalidate`, `dynamic`, `dynamicParams`) with a different caching
  // model, and the build stops printing the plain ○ / ● / ƒ table that
  // STRATEGY.md is checked against. They are left off, as in Addis Eats.
};

export default nextConfig;
