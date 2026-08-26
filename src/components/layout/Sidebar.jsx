import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, CalendarCheck, BarChart2, FileText, Radio, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSeriesFilter } from "../../context/SeriesContext";
import { SERIES, SERIES_SEMESTER } from "../../utils/helpers";

const nav = [
  { to: "/",           icon: LayoutDashboard, label: "Dashboard"      },
  { to: "/students",   icon: Users,           label: "Students"       },
  { to: "/attendance", icon: CalendarCheck,   label: "Attendance"     },
  { to: "/marks",      icon: BarChart2,       label: "Marks & Grades" },
  { to: "/reports",    icon: FileText,        label: "Reports"        },
];

export default function Sidebar({ onClose }) {
  const { seriesFilter } = useSeriesFilter();
  const { pathname } = useLocation();
  const noFilterPage = pathname === "/students";
  const activeSeries = noFilterPage ? null : seriesFilter;

  return (
    <aside className="sidebar-aside">
      {/* Logo row */}
      <div style={{ padding: "20px 16px 0 16px", flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div style={{
              background: "linear-gradient(135deg, var(--ete-primary), var(--ete-info))",
              borderRadius: 10, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Radio size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, lineHeight: 1, color: "var(--ete-text)" }}>ETE Dept</div>
              <div style={{ fontSize: "0.62rem", color: "var(--ete-primary)", letterSpacing: "0.12em", fontWeight: 600 }}>DASHBOARD</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="sidebar-close-btn" aria-label="Close sidebar">
              <X size={18} />
            </button>
          )}
        </div>
        <div style={{ marginTop: 10, marginBottom: 18, fontSize: "0.63rem", color: "var(--ete-muted)", letterSpacing: "0.06em", borderTop: "1px solid var(--ete-border)", paddingTop: 10 }}>
          Electronics & Telecommunication Engineering
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            onClick={onClose}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Series overview */}
      <div style={{ margin: "0 16px", borderTop: "1px solid var(--ete-border)", paddingTop: 14, paddingBottom: 4, flexShrink: 0 }}>
        <div style={{ fontSize: "0.6rem", color: "var(--ete-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
          Series Overview
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {SERIES.map((s) => {
            const isFocus = activeSeries && activeSeries !== "All" && activeSeries === s;
            return (
              <div key={s} className="flex items-center justify-between">
                <span className={"series-pill s" + s}>{s}</span>
                <span style={{ fontSize: "0.68rem", color: "var(--ete-muted)" }}>{SERIES_SEMESTER[s]} Sem</span>
                {isFocus && (
                  <span style={{ fontSize: "0.58rem", color: "var(--ete-primary)", fontWeight: 700, letterSpacing: "0.08em" }}>★ FOCUS</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ margin: "0 16px", borderTop: "1px solid var(--ete-border)", padding: "14px 0", fontSize: "0.68rem", color: "var(--ete-muted)", textAlign: "center", flexShrink: 0 }}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="pulse-dot" style={{ width: 6, height: 6 }} />
          <span style={{ color: "var(--ete-primary)", fontWeight: 600 }}>System Online</span>
        </div>
        ETE Dashboard v3.0
      </div>
    </aside>
  );
}
