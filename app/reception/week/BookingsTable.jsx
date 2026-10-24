import Link from "next/link";
import PropTypes from "prop-types";
import { SORTS, weekHref } from "@/lib/dashboard";
import { etb } from "@/lib/format";

// Every booking of the week, as a real table: caption, thead, th scope, the
// fee right-aligned in tabular figures. Sorting and paging are links to URLs
// (?sort=fee&dir=desc&page=2), so the table stays a server component, the
// back button works, and the active column says so with aria-sort.
const COLUMNS = [
  { key: "when", numeric: false },
  { key: null, label: "Reference" },
  { key: "patient" },
  { key: "doctor" },
  { key: "fee", numeric: true },
  { key: "status" },
];

const ORDER_WORDS = {
  when: ["earliest first", "latest first"],
  patient: ["A to Z", "Z to A"],
  doctor: ["A to Z", "Z to A"],
  fee: ["lowest first", "highest first"],
  status: ["A to Z", "Z to A"],
};

function BookingsTable({ view, table, clinicName, range }) {
  const { sort, dir } = view;
  const order = `${SORTS[sort].label.toLowerCase()}, ${ORDER_WORDS[sort][dir === "asc" ? 0 : 1]}`;

  return (
    <>
      <div className="table-scroll" role="region" aria-labelledby="bookings-caption" tabIndex={0}>
        <table className="table">
          <caption id="bookings-caption">
            Bookings at {clinicName}, {range}, sorted by {order}.
            {table.pages > 1 && ` Page ${table.page} of ${table.pages}.`}
          </caption>
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const label = col.label ?? SORTS[col.key].label;
                if (!col.key) {
                  return (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  );
                }
                const active = sort === col.key;
                // Pressing the sorted column flips it; another column starts
                // ascending. Either way, back to page 1.
                const nextDir = active && dir === "asc" ? "desc" : "asc";
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={col.numeric ? "num" : undefined}
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <Link className="sort" href={weekHref({ ...view, sort: col.key, dir: nextDir, page: 1 })}>
                      {label}
                      <span className="sort__arrow" aria-hidden="true">
                        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                      <span className="visually-hidden">
                        , sort {active && dir === "asc" ? ORDER_WORDS[col.key][1] : ORDER_WORDS[col.key][0]}
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((b) => (
              <tr key={b.id}>
                <td>{b.whenLabel}</td>
                <td className="reference">{b.id}</td>
                <td>{b.patientName}</td>
                <td>{b.doctorName}</td>
                <td className="num">{etb(b.fee)}</td>
                <td>
                  <span className={`status status--${b.status}`}>{b.statusLabel}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.pages > 1 && (
        <nav className="pager" aria-label="Bookings this week, by page">
          {table.page > 1 ? (
            <Link href={weekHref({ ...view, page: table.page - 1 })}>&larr; Previous page</Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span>
            Page {table.page} of {table.pages} · {table.total} bookings
          </span>
          {table.page < table.pages && <Link href={weekHref({ ...view, page: table.page + 1 })}>Next page &rarr;</Link>}
        </nav>
      )}
    </>
  );
}

BookingsTable.propTypes = {
  view: PropTypes.shape({ sort: PropTypes.string.isRequired, dir: PropTypes.string.isRequired }).isRequired,
  table: PropTypes.shape({
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    page: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  clinicName: PropTypes.string.isRequired,
  range: PropTypes.string.isRequired,
};

export default BookingsTable;
