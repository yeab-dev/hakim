import { Suspense } from "react";
import { getAreas, getSpecialties, isArea, isSpecialty } from "@/lib/data";
import ClinicList from "./ClinicList";
import ClinicListSkeleton from "./ClinicListSkeleton";
import FilterBar from "./FilterBar";

export const metadata = { title: "Clinics" };

// Dynamic (ƒ): the page reads `searchParams` — the filters are part of the
// request — and the "soonest open slot" on every card changes with each
// booking and with the clock.
export default async function ClinicsPage({ searchParams }) {
  const query = await searchParams;
  // Query values are user input: only known ids get through.
  const specialty = isSpecialty(query.specialty) ? query.specialty : undefined;
  const area = isArea(query.area) ? query.area : undefined;
  const fail = query.fail === "1";
  const ignored = (query.specialty && !specialty) || (query.area && !area);

  return (
    <>
      <h1>Clinics</h1>
      <FilterBar specialties={getSpecialties()} areas={getAreas()} specialty={specialty} area={area} />
      {ignored && <p className="note">An unknown filter in the address was ignored.</p>}

      {/* The filter bar is sent at once; only the list waits. The key makes a
          new search show the skeleton again instead of the old results. */}
      <Suspense key={`${specialty}|${area}|${fail}`} fallback={<ClinicListSkeleton />}>
        <ClinicList specialty={specialty} area={area} fail={fail} />
      </Suspense>
    </>
  );
}
