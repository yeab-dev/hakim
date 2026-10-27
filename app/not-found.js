import Link from "next/link";

export const metadata = {
  title: "Page not found",
  description: "There is no page, clinic, slot or booking at this address on Hakim.",
};

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
