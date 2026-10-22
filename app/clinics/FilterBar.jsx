import Form from "next/form";
import Link from "next/link";
import PropTypes from "prop-types";

// The two filters, as a GET form. Submitting it *is* changing the URL —
// /clinics?specialty=dentistry&area=bole — so a search can be shared and the
// back button works. next/form turns the submission into a client-side
// navigation when JavaScript is there, and a plain page load when it is not.
//
// A server component: it holds no state (the URL does), so it ships no code
// of its own. The `key` remounts the selects when the URL changes under them
// (back/forward), so they always show what the list is showing.
function FilterBar({ specialties, areas, specialty, area }) {
  return (
    <Form action="/clinics" className="filters" key={`${specialty}|${area}`} aria-label="Filter clinics">
      <div className="filters__field">
        <label htmlFor="specialty">Specialty</label>
        <select id="specialty" name="specialty" defaultValue={specialty ?? ""}>
          <option value="">Any specialty</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filters__field">
        <label htmlFor="area">Area</label>
        <select id="area" name="area" defaultValue={area ?? ""}>
          <option value="">Anywhere in Addis</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="filters__actions">
        <button type="submit" className="button">
          Show clinics
        </button>
        {(specialty || area) && <Link href="/clinics">Clear</Link>}
      </div>
    </Form>
  );
}

const option = PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired });

FilterBar.propTypes = {
  specialties: PropTypes.arrayOf(option).isRequired,
  areas: PropTypes.arrayOf(option).isRequired,
  specialty: PropTypes.string,
  area: PropTypes.string,
};

export default FilterBar;
