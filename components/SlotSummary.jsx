import PropTypes from "prop-types";

function SlotSummary({ rows }) {
  return (
    <div className="summary">
      <dl>
        {rows.map(([term, detail]) => (
          <div key={term} style={{ display: "contents" }}>
            <dt>{term}</dt>
            <dd>{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

SlotSummary.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)).isRequired,
};

export default SlotSummary;
