import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>See a doctor this week, without the morning queue</h1>
      <p>Find a clinic in Addis Ababa, pick an open slot, and book it in a minute.</p>
      <p>
        <Link href="/clinics">Find a clinic</Link>
      </p>
    </>
  );
}
