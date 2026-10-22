/** @type {import('next').NextConfig} */
const nextConfig = {
  // There is a pnpm-workspace.yaml in a parent folder; without this Next.js
  // warns on every build that it is looking outside the project.
  turbopack: { root: import.meta.dirname },

  // create-next-app 16.4 switches on `cacheComponents` and
  // `partialPrefetching`. Both replace the route segment options Days 36–40
  // teach (`revalidate`, `dynamic`, `dynamicParams`) with a different caching
  // model, and the build stops printing the plain ○ / ● / ƒ table that
  // STRATEGY.md is checked against. They are left off, as in Addis Eats.
};

export default nextConfig;
