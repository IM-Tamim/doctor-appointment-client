import { Bell, Search, Menu } from "lucide-react";

export default function Header({ pageTitle, pageDesc }) {
  return (
    <header
      style={{
        background: "var(--ete-surface)",
        borderBottom: "1px solid var(--ete-border)",
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(10px)",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            margin: 0,
            color: "#e2e8f0",
            lineHeight: 1.2,
          }}
        >
          {pageTitle}
        </h1>
        {pageDesc && (
          <p style={{ fontSize: "0.72rem", color: "var(--ete-muted)", margin: 0, marginTop: 2 }}>
            {pageDesc}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--ete-muted)", borderRadius: 10 }}
        >
          <Search size={17} />
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--ete-muted)", borderRadius: 10, position: "relative" }}
        >
          <Bell size={17} />
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              background: "var(--ete-accent)",
              borderRadius: "50%",
            }}
          />
        </button>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg,#00c9a7,#4facfe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "0.8rem",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
