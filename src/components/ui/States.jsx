export function LoadingSpinner({ text = "Loading data..." }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 16 }}>
      <div className="spinner" />
      <span style={{ fontSize: "0.8rem", color: "var(--ete-muted)" }}>{text}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="glow-card" style={{ padding: "24px", textAlign: "center", borderColor: "var(--ete-accent)" }}>
      <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>⚠️</div>
      <div style={{ color: "var(--ete-accent)", fontWeight: 600, marginBottom: 6 }}>Failed to load data</div>
      <div style={{ fontSize: "0.8rem", color: "var(--ete-muted)", marginBottom: 16 }}>{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-sm" style={{ background: "transparent", color: "var(--ete-accent)", border: "1px solid var(--ete-accent)", borderRadius: 8 }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ text = "No data available" }) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ete-muted)", fontSize: "0.875rem" }}>
      <div style={{ fontSize: "2rem", marginBottom: 8 }}>📭</div>
      {text}
    </div>
  );
}
