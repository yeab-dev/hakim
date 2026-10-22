import ClinicListSkeleton from "./ClinicListSkeleton";

// Shown while the clinics segment is on its way — the moment between clicking
// "Find a clinic" and the page's first bytes. Inside the page, a Suspense
// boundary takes over so the filters appear before the list.
export default function Loading() {
  return (
    <>
      <h1>Clinics</h1>
      <ClinicListSkeleton />
    </>
  );
}
