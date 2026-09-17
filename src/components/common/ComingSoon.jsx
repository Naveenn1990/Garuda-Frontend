// Placeholder page for modules that are scaffolded in the sidebar but not yet built
// out. Keeps navigation working and communicates that the feature is in progress.
import { FiTool } from "react-icons/fi";
import PageHeader from "./PageHeader";
import Card from "./Card";

export default function ComingSoon({ title, subtitle, description }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle || "Coming soon"} />
      <Card>
        <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <FiTool size={40} style={{ marginBottom: 16, color: "var(--color-primary, #c68629)" }} />
          <h3 style={{ margin: "0 0 8px", color: "var(--color-text, #1c1b17)" }}>{title}</h3>
          <p style={{ margin: 0, maxWidth: 460, marginInline: "auto" }}>
            {description ||
              "This module is set up and ready. We'll build out the full workflow next."}
          </p>
        </div>
      </Card>
    </div>
  );
}
