export default function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  const c = color || "var(--ete-primary)";
  return (
    <div className="glow-card" style={{ padding: "20px 22px" }}>
      <div className="flex items-start justify-between">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.65rem", color: "var(--ete-muted)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: c, lineHeight: 1, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)" }}>{sub}</div>}
          {trend !== undefined && (
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: trend >= 0 ? "var(--ete-primary)" : "var(--ete-accent)", marginTop: 6 }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last term
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${c}18`,
            border: `1px solid ${c}30`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={20} color={c} />
          </div>
        )}
      </div>
    </div>
  );
}
