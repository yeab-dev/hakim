import Link from "next/link";
import { getAreas, getSpecialties } from "@/lib/data";

export const metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const specialties = getSpecialties();
  const areas = getAreas();

  return (
    <>
      <section className="hero">
        <h1>See a doctor this week, without the morning queue</h1>
        <p className="lead">
          Find a clinic in Addis Ababa, see which doctors have free time in the next seven days, and
          book a slot in a minute — for yourself or for someone in your family.
        </p>
        <p>
          <Link className="button" href="/clinics">
            Find a clinic
          </Link>
        </p>
      </section>

      <section aria-labelledby="specialties-heading">
        <h2 id="specialties-heading">What kind of doctor do you need?</h2>
        <ul className="tiles">
          {specialties.map((s) => (
            <li key={s.id}>
              <Link className="tile" href={`/clinics?specialty=${s.id}`}>
                <span className="tile__title">{s.name}</span>
                <span className="tile__text">{s.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading">Or start from where you can get to</h2>
        <ul className="chips">
          {areas.map((a) => (
            <li key={a.id}>
              <Link className="chip" href={`/clinics?area=${a.id}`}>
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
