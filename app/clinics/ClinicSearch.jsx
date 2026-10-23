"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/fetcher";

const MIN = 2; // the same SEARCH_MIN as lib/data.js — shorter matches nearly everything

// Search clinics and doctors by name as you type. The one query here that
// cannot run on the server: it is triggered by typing.
//
// - Debounced 300 ms: one request per pause, not one per keystroke.
// - A null key while the term is shorter than two characters: no request at
//   all for an empty box.
// - keepPreviousData: the old results stay (dimmed) while the next ones load,
//   so the list never flashes empty between "han" and "hann".
// - SWR guarantees the results shown belong to the current key, so a slow
//   answer for "ha" can never overwrite the answer for "hanna".
export default function ClinicSearch() {
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term.trim(), 300);
  const key = debounced.length >= MIN ? `/api/search?q=${encodeURIComponent(debounced)}` : null;

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false, // names change with a deploy, not while you look
  });

  const showing = key && data;
  const stale = showing && data.query !== debounced;
  const total = showing ? data.clinics.length + data.doctors.length : 0;

  let status = "";
  if (term.trim().length > 0 && term.trim().length < MIN) status = "Keep typing…";
  else if (error) status = "Search is not answering. The filters below still work.";
  else if (key && isLoading && !data) status = "Searching…";
  else if (showing) status = `${total === 0 ? "Nothing" : total} found for “${data.query}”${isValidating ? " — updating…" : ""}`;

  return (
    <section className={stale ? "search search--stale" : "search"} aria-labelledby="search-label">
      <label id="search-label" className="search__label" htmlFor="search">
        Search by clinic or doctor
      </label>
      <input
        id="search"
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="e.g. Hanna, dental, Bole"
        autoComplete="off"
        aria-describedby="search-status"
      />
      <p id="search-status" className="search__status" role="status">
        {status}
      </p>

      {showing && total > 0 && (
        <ul className="search__results" aria-label="Search results">
          {data.clinics.map((c) => (
            <li key={c.id}>
              <Link href={`/clinics/${c.id}`}>
                {c.name}
                <span className="search__meta">Clinic · {c.areaName}</span>
              </Link>
            </li>
          ))}
          {data.doctors.map((d) => (
            <li key={d.id}>
              <Link href={`/clinics/${d.clinicId}#${d.id}`}>
                {d.name}
                <span className="search__meta">
                  {d.specialtyName} · {d.clinicName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
