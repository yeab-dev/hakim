import { Suspense } from "react";
import { getAreas, getSpecialties, isArea, isSpecialty } from "@/lib/data";
import { openGraph } from "@/lib/site";
import ClinicList from "./ClinicList";
import ClinicListSkeleton from "./ClinicListSkeleton";
import ClinicSearch from "./ClinicSearch";
import FilterBar from "./FilterBar";

const nameOf = (list, id) => list.find((x) => x.id === id)?.name;

// The filters only known ids, in one order. The page and its metadata both
// use this, so the canonical URL, title and description describe exactly the
// list on screen. Unknown values, ?fail= and ?slow= are left out.
async function readFilters(searchParams) {
  const query = await searchParams;
  return {
    query,
    specialty: isSpecialty(query.specialty) ? query.specialty : undefined,
    area: isArea(query.area) ? query.area : undefined,
  };
}

// "Dentistry clinics" + "in Kazanchis": the h1, the title and the
// description are all built from this, so they always agree with the list.
function describe(specialty, area) {
  const specialtyName = nameOf(getSpecialties(), specialty);
  const areaName = nameOf(getAreas(), area);
  return {
    what: specialtyName ? `${specialtyName} clinics` : "Clinics",
    where: areaName ? `in ${areaName}` : "across Addis Ababa",
    filtered: Boolean(specialtyName || areaName),
  };
}

// A filtered list is a page someone shares ("dentists in Kazanchis"), so it
// keeps its filters in the canonical URL; everything else in the query string
// (an unknown filter, ?fail=1, ?ref=telegram) is not part of the page and is
// dropped from it. /clinics?specialty=dentistry&ref=x → /clinics?specialty=dentistry.
export async function generateMetadata({ searchParams }) {
  const { specialty, area } = await readFilters(searchParams);
  const params = new URLSearchParams();
  if (specialty) params.set("specialty", specialty);
  if (area) params.set("area", area);
  const canonical = params.size ? `/clinics?${params}` : "/clinics";

  const { what, where, filtered } = describe(specialty, area);
  const title = `${what} ${where}`;
  const description = filtered
    ? `${what} ${where}, Addis Ababa, each with its soonest open appointment this week. Book online instead of queueing at dawn.`
    : "Compare clinics across Addis Ababa by specialty and area, each with its soonest open appointment in the next seven days.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: openGraph({ title: `${title} · Hakim`, description, path: canonical }),
  };
}

// Dynamic (ƒ): the page reads `searchParams` — the filters are part of the
// request — and the "soonest open slot" on every card changes with each
// booking and with the clock.
export default async function ClinicsPage({ searchParams }) {
  // Query values are user input: only known ids get through.
  const { query, specialty, area } = await readFilters(searchParams);
  const fail = query.fail === "1";
  const slow = query.slow === "1"; // demo switch: shows the skeleton for 700 ms
  const ignored = (query.specialty && !specialty) || (query.area && !area);
  const { what, where } = describe(specialty, area);

  return (
    <>
      <h1>
        {what} {where}
      </h1>
      <ClinicSearch />
      <FilterBar specialties={getSpecialties()} areas={getAreas()} specialty={specialty} area={area} />
      {ignored && <p className="note">An unknown filter in the address was ignored.</p>}

      {/* The filter bar is sent at once; only the list waits. The key makes a
          new search show the skeleton again instead of the old results. */}
      <Suspense key={`${specialty}|${area}|${fail}|${slow}`} fallback={<ClinicListSkeleton />}>
        <ClinicList specialty={specialty} area={area} fail={fail} slow={slow} />
      </Suspense>
    </>
  );
}
