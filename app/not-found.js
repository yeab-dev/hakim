import Link from "next/link";

export const metadata = {
  title: "Page not found",
  description: "There is no page, clinic, slot or booking at this address on Hakim.",
};

// Every kind of missing: an address no folder claims, and a page that calls
// notFound() for an id that does not exist. Built once as a static page, so it
// does not print the address — reading the path here would make the server
// HTML disagree with the browser's.
export default function NotFound() {
  return (
    <>
      <h1>Nothing at this address</h1>
      <p>The page, clinic, slot or booking you asked for does not exist.</p>
      <p>
        <Link href="/clinics">Find a clinic</Link> or <Link href="/">go home</Link>.
      </p>
    </>
  );
}
