"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fetcher } from "@/lib/fetcher";

const MIN = 2;

export default function ClinicSearch() {
  const [term, setTerm] = useState("");
  const debounced = useDebouncedValue(term.trim(), 300);
  const key = debounced.length >= MIN ? `/api/search?q=${encodeURIComponent(debounced)}` : null;

  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
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
