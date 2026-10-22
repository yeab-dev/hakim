import PropTypes from "prop-types";

// Marks a screen that exists on the route map but is not built yet, and says
// what data it will need — straight from the brief in README.md.
function Placeholder({ needs }) {
  return (
    <div className="placeholder">
      <p>
        <strong>Not built yet.</strong> Needs: {needs}
      </p>
    </div>
  );
}

Placeholder.propTypes = {
  needs: PropTypes.string.isRequired,
};

export default Placeholder;
