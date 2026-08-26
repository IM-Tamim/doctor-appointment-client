import { useState, useEffect } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Search } from "lucide-react";
import { LoadingSpinner } from "../components/ui/States";
import { AttendanceBarChart, StudentAttendanceBar } from "../components/charts/Charts";
import { fetchAttendance, fetchAttendanceSummary } from "../utils/api";
import { SERIES_SUBJECTS, seriesPillClass, getAttendanceColor } from "../utils/helpers";
import { useSeriesFilter } from "../context/SeriesContext";

const MOCK_DOCS = [
  {
    _id: "1", studentName: "FATIN AWSAF AMIN", roll: "2204001", series: "22", semester: "5th",
    subjects: [
      { subject: "ETE-3111", totalClasses: 8, totalPresent: 8, totalAbsent: 0, attendancePercentage: 100, records: [{ date: "2025-01-06", status: "present" }, { date: "2025-01-20", status: "present" }] },
      { subject: "ETE-3113", totalClasses: 8, totalPresent: 7, totalAbsent: 1, attendancePercentage: 87.5, records: [] },
      { subject: "ETE-3115", totalClasses: 8, totalPresent: 8, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "CSE-3154", totalClasses: 8, totalPresent: 6, totalAbsent: 2, attendancePercentage: 75, records: [] },
      { subject: "EEE-3153", totalClasses: 8, totalPresent: 5, totalAbsent: 3, attendancePercentage: 62.5, records: [] },
    ],
  },
  {
    _id: "2", studentName: "SHEIKH TANJIM AHMED", roll: "2204002", series: "22", semester: "5th",
    subjects: [
      { subject: "ETE-3111", totalClasses: 8, totalPresent: 7, totalAbsent: 1, attendancePercentage: 87.5, records: [] },
      { subject: "ETE-3113", totalClasses: 8, totalPresent: 8, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "ETE-3115", totalClasses: 8, totalPresent: 6, totalAbsent: 2, attendancePercentage: 75, records: [] },
      { subject: "CSE-3154", totalClasses: 8, totalPresent: 8, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "EEE-3153", totalClasses: 8, totalPresent: 7, totalAbsent: 1, attendancePercentage: 87.5, records: [] },
    ],
  },
  {
    _id: "3", studentName: "MAHMUDUL HASAN", roll: "2304001", series: "23", semester: "3rd",
    subjects: [
      { subject: "ETE-2111", totalClasses: 2, totalPresent: 2, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "ETE-2113", totalClasses: 2, totalPresent: 1, totalAbsent: 1, attendancePercentage: 50, records: [] },
      { subject: "CSE-2153", totalClasses: 2, totalPresent: 2, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "HUM-2115", totalClasses: 2, totalPresent: 2, totalAbsent: 0, attendancePercentage: 100, records: [] },
      { subject: "ETE-2117", totalClasses: 2, totalPresent: 1, totalAbsent: 1, attendancePercentage: 50, records: [] },
    ],
  },
];

const MOCK_SUMMARY_BY_SERIES = {
  "22": [
    { subject: "ETE-3111", present: 15, total: 16, avgPct: 94 },
    { subject: "ETE-3113", present: 15, total: 16, avgPct: 94 },
    { subject: "ETE-3115", present: 14, total: 16, avgPct: 88 },
    { subject: "CSE-3154", present: 14, total: 16, avgPct: 88 },
    { subject: "EEE-3153", present: 12, total: 16, avgPct: 75 },
  ],
  "23": [
    { subject: "ETE-2111", present: 2, total: 2, avgPct: 100 },
    { subject: "ETE-2113", present: 1, total: 2, avgPct: 50 },
    { subject: "CSE-2153", present: 2, total: 2, avgPct: 100 },
    { subject: "HUM-2115", present: 2, total: 2, avgPct: 100 },
    { subject: "ETE-2117", present: 1, total: 2, avgPct: 50 },
  ],
};

export default function Attendance() {
  const { seriesFilter } = useSeriesFilter();
  const [docs, setDocs]         = useState([]);
  const [summary, setSummary]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [attRes, sumRes] = await Promise.all([
        fetchAttendance(seriesFilter !== "All" ? seriesFilter : null),
        fetchAttendanceSummary(seriesFilter !== "All" ? seriesFilter : null),
      ]);
      setDocs(attRes.data);
      setSummary(sumRes.data);
    } catch {
      const filtered = seriesFilter === "All" ? MOCK_DOCS : MOCK_DOCS.filter((d) => d.series === seriesFilter);
      setDocs(filtered);
      setSummary(MOCK_SUMMARY_BY_SERIES[seriesFilter] || MOCK_SUMMARY_BY_SERIES["22"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [seriesFilter]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const displayDocs = docs.filter((d) => {
    if (!search) return true;
    return d.roll?.toLowerCase().includes(search.toLowerCase()) ||
           d.studentName?.toLowerCase().includes(search.toLowerCase());
  });

  let totalPresent = 0, totalClasses = 0;
  docs.forEach((doc) => {
    doc.subjects?.forEach((sub) => { totalPresent += sub.totalPresent || 0; totalClasses += sub.totalClasses || 0; });
  });
  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  if (loading) return <LoadingSpinner text="Loading attendance records..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Charts */}
      <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="glow-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
            Subject-wise Avg Attendance {seriesFilter !== "All" ? `· ${seriesFilter}-Series` : "· All Series"}
          </div>
          <AttendanceBarChart data={summary.length ? summary : (MOCK_SUMMARY_BY_SERIES[seriesFilter] || MOCK_SUMMARY_BY_SERIES["22"])} />
        </div>

        <div className="glow-card" style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
            Overview · {seriesFilter !== "All" ? `${seriesFilter}-Series` : "All Series"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)", marginBottom: 6 }}>Overall Attendance Rate</div>
              <div className="flex items-center gap-3">
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${overallPct}%`, background: getAttendanceColor(overallPct) }} />
                </div>
                <span className="mono" style={{ fontWeight: 800, fontSize: "1.2rem", color: getAttendanceColor(overallPct) }}>{overallPct}%</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Students",      value: docs.length,  color: "#4facfe" },
                { label: "Total Classes", value: totalClasses, color: "#a78bfa" },
                { label: "Total Present", value: totalPresent, color: "#00c9a7" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--ete-surface)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "0.6rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: "1.3rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {docs.filter((doc) => {
              let p = 0, c = 0;
              doc.subjects?.forEach((s) => { p += s.totalPresent; c += s.totalClasses; });
              return c > 0 && (p / c) * 100 < 75;
            }).length > 0 && (
              <div style={{ background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: "0.7rem", color: "#ff6b35", fontWeight: 700 }}>
                  ⚠️ {docs.filter((doc) => {
                    let p = 0, c = 0;
                    doc.subjects?.forEach((s) => { p += s.totalPresent; c += s.totalClasses; });
                    return c > 0 && (p / c) * 100 < 75;
                  }).length} student(s) below 75% — expand rows below
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student records table */}
      <div className="glow-card" style={{ padding: "20px 22px" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 2 }}>Student Attendance Records</div>
            <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)" }}>
              {docs.length} students · Click a row to expand subject details
            </div>
          </div>
          {/* Search by roll inside this card */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ete-muted)" }} />
            <input
              type="text"
              placeholder="Search by roll or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm"
              style={{ paddingLeft: 30, background: "var(--ete-surface)", border: "1px solid var(--ete-border)", color: "var(--ete-text)", borderRadius: 8, fontSize: "0.78rem", width: 210 }}
            />
          </div>
          <button onClick={load} className="btn btn-sm btn-ghost" style={{ color: "var(--ete-muted)", borderRadius: 8 }}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="ete-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Roll</th>
                <th>Series</th>
                <th>Semester</th>
                <th>Overall %</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayDocs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ete-muted)", padding: "32px" }}>No records found</td></tr>
              ) : (
                displayDocs.map((doc, idx) => {
                  let p = 0, c = 0;
                  doc.subjects?.forEach((s) => { p += s.totalPresent; c += s.totalClasses; });
                  const pct   = c > 0 ? Math.round((p / c) * 100) : 0;
                  const isLow = pct < 75;
                  const isOpen = expanded[doc._id];

                  return (
                    <>
                      <tr key={doc._id} onClick={() => toggleExpand(doc._id)}
                        style={{ cursor: "pointer", background: isOpen ? "rgba(0,201,167,0.03)" : undefined }}>
                        <td className="mono" style={{ color: "var(--ete-muted)", fontSize: "0.75rem" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{doc.studentName}</td>
                        <td className="mono" style={{ color: "var(--ete-primary)", fontSize: "0.8rem" }}>{doc.roll}</td>
                        <td><span className={seriesPillClass(doc.series)}>{doc.series}</span></td>
                        <td style={{ fontSize: "0.8rem" }}>{doc.semester}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-bar" style={{ width: 70 }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: getAttendanceColor(pct) }} />
                            </div>
                            <span className="mono" style={{ fontSize: "0.78rem", fontWeight: 700, color: getAttendanceColor(pct) }}>{pct}%</span>
                          </div>
                        </td>
                        <td>{isLow ? <span className="badge-absent">⚠ Low</span> : <span className="badge-present">Good</span>}</td>
                        <td style={{ color: "var(--ete-muted)" }}>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</td>
                      </tr>

                      {isOpen && (
                        <tr key={doc._id + "-detail"}>
                          <td colSpan={8} style={{ padding: "0 16px 16px 16px", background: "rgba(0,201,167,0.02)" }}>
                            <div style={{ paddingTop: 12 }}>
                              <div style={{ marginBottom: 10, fontSize: "0.7rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                                Subject-wise breakdown
                              </div>
                              <div style={{ maxWidth: 500, marginBottom: 14 }}>
                                <StudentAttendanceBar data={doc.subjects || []} />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 8 }}>
                                {(doc.subjects || []).map((sub) => (
                                  <div key={sub.subject} style={{
                                    background: "var(--ete-surface)",
                                    border: `1px solid ${sub.attendancePercentage >= 75 ? "rgba(0,201,167,0.2)" : "rgba(255,107,53,0.25)"}`,
                                    borderRadius: 10, padding: "10px 12px",
                                  }}>
                                    <div className="mono" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ete-primary)", marginBottom: 6 }}>{sub.subject}</div>
                                    <div style={{ display: "flex", gap: 8, fontSize: "0.7rem", color: "var(--ete-muted)", marginBottom: 6, flexWrap: "wrap" }}>
                                      <span>Classes: <strong style={{ color: "var(--ete-text)" }}>{sub.totalClasses}</strong></span>
                                      <span>✅ {sub.totalPresent}</span>
                                      <span>❌ {sub.totalAbsent}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="progress-bar" style={{ flex: 1 }}>
                                        <div className="progress-fill" style={{ width: `${sub.attendancePercentage}%`, background: getAttendanceColor(sub.attendancePercentage) }} />
                                      </div>
                                      <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 800, color: getAttendanceColor(sub.attendancePercentage) }}>
                                        {sub.attendancePercentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Date records */}
                              {(doc.subjects || []).some((s) => s.records?.length > 0) && (
                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: "0.68rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 8 }}>
                                    Date-wise records
                                  </div>
                                  {(doc.subjects || []).filter((s) => s.records?.length > 0).map((sub) => (
                                    <div key={sub.subject} style={{ marginBottom: 8 }}>
                                      <div className="mono" style={{ fontSize: "0.68rem", color: "var(--ete-primary)", fontWeight: 600, marginBottom: 4 }}>{sub.subject}</div>
                                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                        {sub.records.map((rec, ri) => (
                                          <span key={ri} className={rec.status === "present" ? "badge-present" : "badge-absent"} style={{ fontSize: "0.65rem" }}>
                                            {rec.date}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
