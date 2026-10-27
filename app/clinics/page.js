import { Suspense } from "react";
import { getAreas, getSpecialties, isArea, isSpecialty } from "@/lib/data";
import { openGraph } from "@/lib/site";
import ClinicList from "./ClinicList";
import ClinicListSkeleton from "./ClinicListSkeleton";
import ClinicSearch from "./ClinicSearch";
import FilterBar from "./FilterBar";

const nameOf = (list, id) => list.find((x) => x.id === id)?.name;

async function readFilters(searchParams) {
  const query = await searchParams;
  return {
    query,
    specialty: isSpecialty(query.specialty) ? query.specialty : undefined,
    area: isArea(query.area) ? query.area : undefined,
  };
}

function describe(specialty, area) {
  const specialtyName = nameOf(getSpecialties(), specialty);
  const areaName = nameOf(getAreas(), area);
  return {
    what: specialtyName ? `${specialtyName} clinics` : "Clinics",
    where: areaName ? `in ${areaName}` : "across Addis Ababa",
    filtered: Boolean(specialtyName || areaName),
  };
}

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

export default async function ClinicsPage({ searchParams }) {
  const { query, specialty, area } = await readFilters(searchParams);
  const fail = query.fail === "1";
  const slow = query.slow === "1";
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

      <Suspense key={`${specialty}|${area}|${fail}|${slow}`} fallback={<ClinicListSkeleton />}>
        <ClinicList specialty={specialty} area={area} fail={fail} slow={slow} />
      </Suspense>
    </>
  );
}
