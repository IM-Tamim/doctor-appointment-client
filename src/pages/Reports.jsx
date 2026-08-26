import { useState, useEffect } from "react";
import { GradeDonut, SubjectRadar, PerformerChart, AttendanceTrendLine, SeriesBarChart, AttendanceBarChart, SubjectMarksBar } from "../components/charts/Charts";
import { LoadingSpinner } from "../components/ui/States";
import { SERIES, SERIES_SEMESTER, SERIES_SUBJECTS } from "../utils/helpers";
import { useSeriesFilter } from "../context/SeriesContext";
import {
  fetchDashboardStats,
  fetchAttendanceSummary,
  fetchMarksSummary,
  fetchStudents,
} from "../utils/api";

// ── Fallback mock (only used when backend is totally unreachable) ─
const MOCK = {
  totalStudents: 80,
  series22Count: 28,
  avgAttendance: 82,
  avgMarks: 74,
  attendanceTrend: [
    { month: "Jan", pct: 85 }, { month: "Feb", pct: 80 }, { month: "Mar", pct: 77 },
    { month: "Apr", pct: 83 }, { month: "May", pct: 86 }, { month: "Jun", pct: 82 },
  ],
  gradeDistribution: { "A+": 18, "A": 22, "A-": 14, "B+": 20, "B": 16, "B-": 8, "C+": 5, "C": 4, "D": 3, "F": 2 },
  subjectPerformance: [
    { subject: "ETE-3111", avgMarks: 78 }, { subject: "ETE-3113", avgMarks: 72 },
    { subject: "ETE-3115", avgMarks: 80 }, { subject: "CSE-3154", avgMarks: 75 },
    { subject: "EEE-3153", avgMarks: 68 },
  ],
  attSummary: [
    { subject: "ETE-3111", present: 85, total: 100, avgPct: 85 },
    { subject: "ETE-3113", present: 78, total: 100, avgPct: 78 },
    { subject: "ETE-3115", present: 82, total: 100, avgPct: 82 },
    { subject: "CSE-3154", present: 74, total: 100, avgPct: 74 },
    { subject: "EEE-3153", present: 68, total: 100, avgPct: 68 },
  ],
  topStudents: [
    { name: "FATIN AWSAF AMIN",   avgMarks: 87 }, { name: "SHEIKH TANJIM AHMED", avgMarks: 83 },
    { name: "MAHATHIR SIYAM",     avgMarks: 81 }, { name: "SUMAIYA NOSHIN",       avgMarks: 79 },
    { name: "MD. RAKIB HASAN",    avgMarks: 77 }, { name: "MD. TARIK JAMIL",      avgMarks: 38 },
  ],
  seriesDistribution: [
    { series: "20", count: 8 }, { series: "21", count: 10 },
    { series: "22", count: 28 }, { series: "23", count: 18 }, { series: "24", count: 16 },
  ],
};

const ChartCard = ({ title, children }) => (
  <div className="glow-card" style={{ padding: "20px 22px" }}>
    <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
      {title}
    </div>
    {children}
  </div>
);

export default function Reports() {
  const { seriesFilter } = useSeriesFilter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock]   = useState(false);

  useEffect(() => {
    setLoading(true);
    const s = seriesFilter !== "All" ? seriesFilter : null;

    Promise.all([
      fetchDashboardStats(s),
      fetchAttendanceSummary(s),
      fetchMarksSummary(s),
    ])
      .then(([dashRes, attRes, marksRes]) => {
        const dash  = dashRes.data;
        const att   = attRes.data;   // [{ subject, present, total, avgPct }]
        const marks = marksRes.data; // { subjectPerformance, gradeDistribution }

        setData({
          totalStudents:      dash.totalStudents,
          series22Count:      dash.series22Count,
          avgAttendance:      dash.avgAttendance,
          avgMarks:           dash.avgMarks,
          attendanceTrend:    dash.attendanceTrend,
          gradeDistribution:  marks.gradeDistribution,
          subjectPerformance: marks.subjectPerformance,
          attSummary:         att,
          topStudents:        dash.topStudents,
          lowAttendance:      dash.lowAttendance,
          seriesDistribution: dash.seriesDistribution,
        });
        setIsMock(false);
      })
      .catch(() => {
        setData(MOCK);
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  }, [seriesFilter]);

  if (loading) return <LoadingSpinner text="Loading report data..." />;

  const d        = data || MOCK;
  const isSingle = seriesFilter !== "All";

  // Derive insight values from real data
  const bestSubject  = (d.subjectPerformance || []).reduce((a, b) => (b.avgMarks > a.avgMarks ? b : a), { subject: "—", avgMarks: 0 });
  const worstSubject = (d.subjectPerformance || []).reduce((a, b) => (b.avgMarks < a.avgMarks ? b : a), { subject: "—", avgMarks: 100 });
  const topStudent   = (d.topStudents || []).reduce((a, b) => (b.avgMarks > a.avgMarks ? b : a), { name: "—", avgMarks: 0 });
  const lowAttCount  = (d.lowAttendance || []).length;

  // Compute pass rate from grade distribution
  const grades     = d.gradeDistribution || {};
  const totalGrades = Object.values(grades).reduce((a, b) => a + b, 0);
  const failCount   = grades["F"] || 0;
  const passRate    = totalGrades > 0 ? Math.round(((totalGrades - failCount) / totalGrades) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Mock banner */}
      {isMock && (
        <div style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: "0.75rem", color: "#ff6b35" }}>
          ⚠️ Backend unavailable — showing demo data. Start your server and refresh.
        </div>
      )}

      {/* Header bar */}
      <div className="glow-card" style={{ padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
            {isSingle ? `${seriesFilter}-Series Report` : "Full Department Report"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)" }}>
            ETE Department · {isSingle ? `${seriesFilter}-Series · ${SERIES_SEMESTER[seriesFilter]} Semester` : "All Series · Current Session"}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["CSV", "PDF", "Excel"].map((t) => (
            <button key={t}
              onClick={() => alert(`Export as ${t} — connect backend to implement`)}
              className="btn btn-sm"
              style={{ background: "var(--ete-surface)", color: "var(--ete-text)", border: "1px solid var(--ete-border)", borderRadius: 8, fontSize: "0.78rem" }}>
              Export {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 }}>
        {[
          { label: "Total Students",               value: d.totalStudents,              color: "#4facfe" },
          { label: isSingle ? "Semester" : "22-Series", value: isSingle ? SERIES_SEMESTER[seriesFilter] : d.series22Count, color: "#00c9a7" },
          { label: "Avg Marks",                    value: d.avgMarks,                   color: "#a78bfa" },
          { label: "Avg Attendance",               value: `${d.avgAttendance}%`,         color: "#ffce56" },
          { label: "Pass Rate",                    value: `${passRate}%`,               color: "#00c9a7" },
        ].map((s) => (
          <div key={s.label} className="glow-card" style={{ padding: "16px 18px" }}>
            <div style={{ fontSize: "0.62rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Series bar (all) or Grade donut (single) + Attendance trend */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {!isSingle
          ? <ChartCard title="Students by Series"><SeriesBarChart data={d.seriesDistribution || []} /></ChartCard>
          : <ChartCard title={`Grade Distribution · ${seriesFilter}-Series`}><GradeDonut data={d.gradeDistribution} /></ChartCard>
        }
        <ChartCard title={`Monthly Attendance Trend${isSingle ? ` · ${seriesFilter}-Series` : ""}`}>
          <AttendanceTrendLine data={d.attendanceTrend || []} />
        </ChartCard>
      </div>

      {/* Row 2: Attendance by subject + Subject avg marks */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <ChartCard title={`Attendance by Subject${isSingle ? ` · ${seriesFilter}-Series` : ""}`}>
          <AttendanceBarChart data={d.attSummary || []} />
        </ChartCard>
        <ChartCard title={`Subject Avg Marks${isSingle ? ` · ${seriesFilter}-Series` : ""}`}>
          <SubjectMarksBar data={d.subjectPerformance || []} />
        </ChartCard>
      </div>

      {/* Row 3: Grade donut (all only) + Subject radar */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {!isSingle && (
          <ChartCard title="Grade Distribution">
            <GradeDonut data={d.gradeDistribution} />
          </ChartCard>
        )}
        <ChartCard title={`Subject Performance Radar${isSingle ? ` · ${seriesFilter}-Series` : ""}`}>
          <SubjectRadar data={d.subjectPerformance || []} />
        </ChartCard>
      </div>

      {/* Series breakdown table */}
      <div className="glow-card" style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
          {isSingle ? `${seriesFilter}-Series Subject Codes` : "Series Breakdown"}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ete-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><th>Series</th><th>Semester</th><th>Students</th><th>Subjects</th><th>Note</th></tr>
            </thead>
            <tbody>
              {(isSingle ? [seriesFilter] : SERIES).map((s) => {
                const row = (d.seriesDistribution || []).find((r) => r.series === s);
                return (
                  <tr key={s}>
                    <td><span className={"series-pill s" + s}>{s}-Series</span></td>
                    <td>{SERIES_SEMESTER[s]}</td>
                    <td className="mono">{row?.count ?? "—"}</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--ete-muted)" }}>
                      {(SERIES_SUBJECTS[s] || []).join(", ")}
                    </td>
                    <td>
                      {s === seriesFilter && isSingle
                        ? <span className="badge-present">Selected</span>
                        : s === "22" && !isSingle
                        ? <span className="badge-present">Primary Focus</span>
                        : <span style={{ fontSize: "0.75rem", color: "var(--ete-muted)" }}>Active</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight cards — derived from real data */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
        {[
          {
            icon: "📈", title: "Best Subject",
            value: bestSubject.subject,
            sub: `Avg ${bestSubject.avgMarks}/100 — strongest performance`,
            color: "#00c9a7",
          },
          {
            icon: "📉", title: "Needs Attention",
            value: worstSubject.subject,
            sub: `Avg ${worstSubject.avgMarks}/100 — review recommended`,
            color: "#ff6b35",
          },
          {
            icon: "🏆", title: "Top Student",
            value: topStudent.name,
            sub: `${isSingle ? `${seriesFilter}-Series` : "Overall"} · Avg ${topStudent.avgMarks}/100`,
            color: "#ffce56",
          },
          {
            icon: "⚠️", title: "Low Attendance",
            value: lowAttCount > 0 ? `${lowAttCount} student${lowAttCount > 1 ? "s" : ""}` : "None",
            sub: lowAttCount > 0 ? "Below 75% — intervention required" : "All students above 75% ✅",
            color: "#a78bfa",
          },
        ].map((c) => (
          <div key={c.title} className="glow-card" style={{ padding: "18px 20px", borderColor: c.color + "22" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: c.color, marginBottom: 4 }}>{c.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--ete-muted)" }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
