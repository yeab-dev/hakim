import "server-only";
import doctors from "@/data/doctors.json";
import { clinicRange } from "./appointments";
import { addDays, addisToday, weekday } from "./clock";
import { day } from "./format";

// Reception's week view (Day 46): how busy is my clinic this week, per day
// and per doctor, and which bookings make that up.
//
// Everything is worked out here, on the server. The chart is a client
// component, and the only thing that crosses to it is seven summary rows
// (a date label and a count per doctor): never the bookings themselves,
// never a patient's name or number.
//
// Week, sort, direction and page all live in the URL
// (/reception/week?week=2026-10-19&sort=fee&dir=desc&page=2), so a view can
// be linked to, survives a refresh, works without JavaScript, and the table
// stays a server component.

export const PAGE_SIZE = 8;
const WEEKS_BACK = 26; // half a year of history
const WEEKS_AHEAD = 2; // slots only open seven days ahead

// Column → how to compare two rows. Ties fall back to the time.
export const SORTS = {
  when: { label: "Time", compare: (x, y) => x.startsAt.localeCompare(y.startsAt) },
  patient: { label: "Patient", compare: (x, y) => x.patientName.localeCompare(y.patientName, "en") },
  doctor: { label: "Doctor", compare: (x, y) => x.doctorName.localeCompare(y.doctorName, "en") },
  fee: { label: "Fee", compare: (x, y) => x.fee - y.fee },
  status: { label: "Status", compare: (x, y) => x.statusLabel.localeCompare(y.statusLabel, "en") },
};
export const DEFAULT_SORT = "when";

// The Monday of the week that holds `date`.
export function mondayOf(date) {
  return addDays(date, -((weekday(date) + 6) % 7));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The query string is user input: anything that is not a week, column,
// direction or page we have falls back to the default, and says so.
export function readWeekParams(query, today = addisToday()) {
  const thisWeek = mondayOf(today);
  let weekStart = thisWeek;
  let ignored = false;
  if (query.week !== undefined) {
    const ok =
      typeof query.week === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(query.week) &&
      !Number.isNaN(Date.parse(query.week)) &&
      addDays(query.week, 0) === query.week && // no 2026-02-31
      weekday(query.week) === 1 &&
      query.week >= addDays(thisWeek, -7 * WEEKS_BACK) &&
      query.week <= addDays(thisWeek, 7 * WEEKS_AHEAD);
    if (ok) weekStart = query.week;
    else ignored = true;
  }
  const sort = Object.hasOwn(SORTS, query.sort) ? query.sort : DEFAULT_SORT;
  const dir = query.dir === "desc" ? "desc" : "asc";
  const page = Number.parseInt(query.page, 10);
  return {
    thisWeek,
    weekStart,
    sort,
    dir,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    ignored: ignored || (query.sort !== undefined && sort !== query.sort),
    fail: query.fail === "1",
    slow: query.slow === "1",
  };
}

// The address of a view, leaving out whatever is the default, so links stay
// short and one view has one URL.
export function weekHref({ weekStart, thisWeek, sort = DEFAULT_SORT, dir = "asc", page = 1 }) {
  const params = new URLSearchParams();
  if (weekStart && weekStart !== thisWeek) params.set("week", weekStart);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  if (dir !== "asc") params.set("dir", dir);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/reception/week?${params}` : "/reception/week";
}

// One clinic's week. `fail` and `slow` are the demo switches (?fail=1 throws
// so error.js shows; ?slow=1 waits 700 ms so loading.js shows), as on
// /clinics.
export async function clinicWeek(clinicId, { weekStart, today = addisToday(), fail = false, slow = false }) {
  if (slow) await wait(700);
  if (fail) throw new Error("The booking store is not answering.");

  const weekEnd = addDays(weekStart, 6);
  const bookings = await clinicRange(clinicId, weekStart, weekEnd);
  const staff = doctors.filter((d) => d.clinicId === clinicId).map((d) => ({ id: d.id, name: d.name }));

  // The summary rows: per day, how many bookings each doctor has. Cancelled
  // bookings are not counted (the chart says so); they are in the table.
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const counts = Object.fromEntries(staff.map((d) => [d.id, 0]));
    for (const b of bookings) if (b.date === date && b.status !== "cancelled") counts[b.doctorId] += 1;
    return {
      date,
      label: day(date),
      isToday: date === today,
      counts,
      total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    };
  });

  return {
    weekStart,
    weekEnd,
    range: `${day(weekStart)} – ${day(weekEnd)} ${weekEnd.slice(0, 4)}`, // "Mon 19 Oct – Sun 25 Oct 2026"
    doctors: staff,
    days,
    counted: days.reduce((sum, d) => sum + d.total, 0),
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    bookings,
  };
}

// The table's rows for one page, in the order asked for.
export function sortAndPage(bookings, { sort, dir, page }) {
  const { compare } = SORTS[sort];
  const sign = dir === "desc" ? -1 : 1;
  const sorted = [...bookings].sort((x, y) => sign * compare(x, y) || SORTS.when.compare(x, y));
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages); // ?page=99 → the last page
  return {
    rows: sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    pages,
    total: sorted.length,
  };
}
