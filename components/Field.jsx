import PropTypes from "prop-types";

function Field({ as: Control = "input", name, label, hint, error, children, ...rest }) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={error ? "field field--invalid" : "field"}>
      <label className="form__label" htmlFor={name}>
        {label}
      </label>
      <Control id={name} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest}>
        {children}
      </Control>
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error" role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

Field.propTypes = {
  as: PropTypes.oneOf(["input", "select", "textarea"]),
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  hint: PropTypes.node,
  error: PropTypes.string,
  children: PropTypes.node,
};

export default Field;
