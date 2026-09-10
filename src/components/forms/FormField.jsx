// Labelled form field wrapper. Renders a label + input (or arbitrary children) and
// an optional error message.
import "./FormField.css";

export function FormField({ label, error, children, htmlFor }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

export default FormField;
