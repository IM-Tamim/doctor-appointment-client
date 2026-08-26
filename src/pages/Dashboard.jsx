import { useState, useEffect } from "react";
import { Users, CalendarCheck, BarChart2, Award, AlertTriangle } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import { LoadingSpinner } from "../components/ui/States";
import { AttendanceTrendLine, GradeDonut, SubjectRadar, PerformerChart, SeriesBarChart } from "../components/charts/Charts";
import { fetchDashboardStats } from "../utils/api";
import { getAttendanceColor, seriesPillClass, SERIES, SERIES_SEMESTER } from "../utils/helpers";
import { useSeriesFilter } from "../context/SeriesContext";

const buildMock = (sf) => ({
  totalStudents: sf === "All" ? 80 : sf === "22" ? 28 : sf === "23" ? 18 : sf === "24" ? 16 : sf === "21" ? 10 : 8,
  series22Count: 28,
  avgAttendance: sf === "All" ? 82 : sf === "22" ? 88 : 79,
  avgMarks: sf === "All" ? 71 : sf === "22" ? 78 : 68,
  attendanceTrend: [
    { month: "Jan", pct: 85 }, { month: "Feb", pct: 80 }, { month: "Mar", pct: 77 },
    { month: "Apr", pct: 83 }, { month: "May", pct: 86 }, { month: "Jun", pct: 82 },
  ],
  gradeDistribution: { "A+": 18, "A": 22, "A-": 14, "B+": 20, "B": 16, "B-": 8, "C+": 5, "C": 4, "D": 3, "F": 2 },
  subjectPerformance: sf === "22"
    ? [
      { subject: "ETE-3111", avgMarks: 78 }, { subject: "ETE-3113", avgMarks: 72 },
      { subject: "ETE-3115", avgMarks: 80 }, { subject: "CSE-3154", avgMarks: 75 }, { subject: "EEE-3153", avgMarks: 68 },
    ]
    : sf === "23"
      ? [
        { subject: "ETE-2111", avgMarks: 74 }, { subject: "ETE-2113", avgMarks: 70 },
        { subject: "CSE-2153", avgMarks: 76 }, { subject: "HUM-2115", avgMarks: 65 }, { subject: "ETE-2117", avgMarks: 72 },
      ]
      : [
        { subject: "ETE-3111", avgMarks: 78 }, { subject: "ETE-3113", avgMarks: 72 },
        { subject: "ETE-3115", avgMarks: 80 }, { subject: "CSE-3154", avgMarks: 75 },
        { subject: "EEE-3153", avgMarks: 68 }, { subject: "ETE-2111", avgMarks: 74 },
      ],
  topStudents: [
    { name: "FATIN AWSAF AMIN", avgMarks: 87 }, { name: "SAMIHA TABASSUM", avgMarks: 84 },
    { name: "MAHATHIR SIYAM", avgMarks: 82 }, { name: "SUMAIYA NOSHIN", avgMarks: 80 },
    { name: "MD. RAKIB HASAN", avgMarks: 78 },
  ],
  lowAttendance: [
    { name: "MD. TARIK JAMIL", attendance: 55, series: "22" },
    { name: "ARNOB DAS RICKY", attendance: 62, series: "23" },
    { name: "MD. SYMUL HAQUE", attendance: 68, series: "24" },
  ],
  seriesDistribution: [
    { series: "20", count: 8 }, { series: "21", count: 10 },
    { series: "22", count: 28 }, { series: "23", count: 18 }, { series: "24", count: 16 },
  ],
});

const ChartCard = ({ title, children }) => (
  <div className="glow-card" style={{ padding: "20px 22px" }}>
    <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
      {title}
    </div>
    {children}
  </div>
);

export default function Dashboard() {
  const { seriesFilter } = useSeriesFilter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const res = await fetchDashboardStats(seriesFilter !== "All" ? seriesFilter : null);
        setStats(res.data);
        setUseMock(false);
      } catch {
        setStats(buildMock(seriesFilter));
        setUseMock(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [seriesFilter]);

  if (loading) return <LoadingSpinner text="Fetching department data..." />;
  const d = stats || buildMock(seriesFilter);
  const isSingle = seriesFilter !== "All";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {useMock && (
        <div style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: "0.75rem", color: "#ff6b35" }}>
          ⚠️ Backend unavailable — showing demo data. Start your server and refresh.
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 16 }}>
        <StatCard label="Total Students" value={d.totalStudents} sub={isSingle ? `${seriesFilter}-Series only` : "All series combined"} icon={Users} color="#4facfe" />
        {!isSingle && <StatCard label="22-Series Focus" value={d.series22Count || 28} sub="5th Semester · 3rd Year" icon={Award} color="#00c9a7" />}
        <StatCard label="Avg Attendance" value={`${d.avgAttendance}%`} sub={isSingle ? `${seriesFilter}-Series` : "Across all series"} icon={CalendarCheck} color={getAttendanceColor(d.avgAttendance)} />
        <StatCard label="Avg Marks" value={d.avgMarks} sub="Out of 100 overall" icon={BarChart2} color="#a78bfa" />
      </div>

      {/* Series dist + Attendance trend */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {!isSingle && (
          <ChartCard title="Students by Series">
            <SeriesBarChart data={d.seriesDistribution} />
          </ChartCard>
        )}
        <ChartCard title="Monthly Attendance Trend" >
          <AttendanceTrendLine data={d.attendanceTrend} />
        </ChartCard>
        {isSingle && (
          <ChartCard title="Grade Distribution">
            <GradeDonut data={d.gradeDistribution} />
          </ChartCard>
        )}
      </div>

      {/* Grade donut + Subject radar */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {!isSingle && (
          <ChartCard title="Grade Distribution">
            <GradeDonut data={d.gradeDistribution} />
          </ChartCard>
        )}
        <ChartCard title={isSingle ? `${seriesFilter}-Series Subject Performance` : "Subject Performance Radar"}>
          <SubjectRadar data={d.subjectPerformance} />
        </ChartCard>
        {isSingle && (
          <ChartCard title="Top Performers">
            <PerformerChart students={d.topStudents} mode="top" />
          </ChartCard>
        )}
      </div>

      {/* Top performers + Low attendance */}
      {!isSingle && (
        <div className="glow-card" style={{ padding: "20px 22px" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} color="#ff6b35" />
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Low Attendance Alert
            </div>
          </div>
          <LowAttendanceList items={d.lowAttendance} />
        </div>
      )}

      {isSingle && (
        <div className="glow-card" style={{ padding: "20px 22px" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} color="#ff6b35" />
            <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600 }}>
              Low Attendance Alert · {seriesFilter}-Series
            </div>
          </div>
          <LowAttendanceList items={d.lowAttendance.filter((s) => s.series === seriesFilter)} />
        </div>
      )}

      {/* Series summary table (all view only) */}
      {!isSingle && (
        <div className="glow-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
            Series Summary
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="ete-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr><th>Series</th><th>Semester</th><th>Students</th><th>Focus</th></tr>
              </thead>
              <tbody>
                {SERIES.map((s) => {
                  const row = (d.seriesDistribution || []).find((r) => r.series === s);
                  return (
                    <tr key={s}>
                      <td><span className={seriesPillClass(s)}>{s}-Series</span></td>
                      <td>{SERIES_SEMESTER[s]}</td>
                      <td className="mono">{row?.count ?? "—"}</td>
                      <td>
                        {s === "22"
                          ? <span className="badge-present">Primary Focus</span>
                          : <span style={{ fontSize: "0.75rem", color: "var(--ete-muted)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LowAttendanceList({ items }) {
  if (!items || items.length === 0) {
    return <div style={{ fontSize: "0.8rem", color: "var(--ete-muted)", textAlign: "center", padding: "20px 0" }}>✅ No students below 75% attendance</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((s, i) => (
        <div key={i} style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 10, padding: "12px 14px" }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{s.name}</span>
            <span className={seriesPillClass(s.series)}>{s.series}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${s.attendance}%`, background: "#ff6b35" }} />
            </div>
            <span className="mono" style={{ fontSize: "0.75rem", color: "#ff6b35", fontWeight: 700 }}>{s.attendance}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
