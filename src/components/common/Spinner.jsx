import "./common.css";

export function Spinner({ label = "Loading..." }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__dot" />
      <span>{label}</span>
    </div>
  );
}

export default Spinner;
