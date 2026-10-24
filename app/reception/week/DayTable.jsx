import PropTypes from "prop-types";

// The chart's numbers as a table, for anyone who cannot see the SVG (a
// screen reader cannot read bars) and for anyone who wants to check a value.
// A server component: no state, no handlers, nothing shipped.
function DayTable({ days, doctors, range }) {
  return (
    <div className="table-scroll" role="region" aria-labelledby="day-table-caption" tabIndex={0}>
      <table className="table">
        <caption id="day-table-caption">
          Bookings per day and doctor, {range}. Cancelled bookings are not counted.
        </caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {doctors.map((d) => (
              <th key={d.id} scope="col" className="num">
                {d.name}
              </th>
            ))}
            <th scope="col" className="num">
              All doctors
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">
                {day.label}
                {day.isToday && " (today)"}
              </th>
              {doctors.map((d) => (
                <td key={d.id} className="num">
                  {day.counts[d.id]}
                </td>
              ))}
              <td className="num">{day.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Week</th>
            {doctors.map((d) => (
              <td key={d.id} className="num">
                {days.reduce((sum, day) => sum + day.counts[d.id], 0)}
              </td>
            ))}
            <td className="num">{days.reduce((sum, day) => sum + day.total, 0)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

DayTable.propTypes = {
  days: PropTypes.arrayOf(PropTypes.object).isRequired,
  doctors: PropTypes.arrayOf(PropTypes.object).isRequired,
  range: PropTypes.string.isRequired,
};

export default DayTable;
