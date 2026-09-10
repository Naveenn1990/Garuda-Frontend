import "./common.css";

export function Button({ variant = "primary", children, ...props }) {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
