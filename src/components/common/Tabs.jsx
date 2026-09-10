// Simple tab strip. `tabs` is [{ key, label }]; controlled via `active` + `onChange`.
import "./common.css";

export function Tabs({ tabs = [], active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tabs__tab ${active === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
