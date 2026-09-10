import "./common.css";

export function Card({ title, children, actions }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
}

export default Card;
