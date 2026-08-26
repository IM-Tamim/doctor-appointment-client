import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Search } from "lucide-react";
import { LoadingSpinner } from "../components/ui/States";
import { GradeDonut, SubjectRadar, PerformerChart, MarksBreakdownBar } from "../components/charts/Charts";
import { fetchMarks, fetchMarksSummary } from "../utils/api";
import { SERIES, seriesPillClass, getGradeBadgeClass } from "../utils/helpers";
import { useSeriesFilter } from "../context/SeriesContext";

// ── Mock data ─────────────────────────────────────────────────
const MOCK_DOCS = [
  {
    _id: "1", studentName: "FATIN AWSAF AMIN", roll: "2204001", series: "22", semester: "5th",
    subjects: [
      { subject: "ETE-3111", CT: 19, Assignment: 7,  Attendance: 8,  Semester: 53, total: 87, grade: "A+", gradePoint: 4.0 },
      { subject: "ETE-3113", CT: 16, Assignment: 8,  Attendance: 8,  Semester: 44, total: 76, grade: "A",  gradePoint: 3.75 },
      { subject: "ETE-3115", CT: 19, Assignment: 7,  Attendance: 10, Semester: 53, total: 89, grade: "A+", gradePoint: 4.0 },
      { subject: "CSE-3154", CT: 18, Assignment: 7,  Attendance: 10, Semester: 48, total: 83, grade: "A+", gradePoint: 4.0 },
      { subject: "EEE-3153", CT: 14, Assignment: 7,  Attendance: 8,  Semester: 45, total: 74, grade: "A-", gradePoint: 3.5 },
    ],
  },
  {
    _id: "2", studentName: "SHEIKH TANJIM AHMED", roll: "2204002", series: "22", semester: "5th",
    subjects: [
      { subject: "ETE-3111", CT: 17, Assignment: 8,  Attendance: 9,  Semester: 48, total: 82, grade: "A+", gradePoint: 4.0 },
      { subject: "ETE-3113", CT: 15, Assignment: 7,  Attendance: 9,  Semester: 42, total: 73, grade: "A-", gradePoint: 3.5 },
      { subject: "ETE-3115", CT: 18, Assignment: 9,  Attendance: 9,  Semester: 50, total: 86, grade: "A+", gradePoint: 4.0 },
      { subject: "CSE-3154", CT: 16, Assignment: 8,  Attendance: 10, Semester: 45, total: 79, grade: "A",  gradePoint: 3.75 },
      { subject: "EEE-3153", CT: 13, Assignment: 6,  Attendance: 7,  Semester: 43, total: 69, grade: "B+", gradePoint: 3.25 },
    ],
  },
  {
    _id: "3", studentName: "MAHMUDUL HASAN", roll: "2304001", series: "23", semester: "3rd",
    subjects: [
      { subject: "ETE-2111", CT: 15, Assignment: 8, Attendance: 8, Semester: 46, total: 77, grade: "A",  gradePoint: 3.75 },
      { subject: "ETE-2113", CT: 14, Assignment: 7, Attendance: 7, Semester: 42, total: 70, grade: "A-", gradePoint: 3.5 },
      { subject: "CSE-2153", CT: 16, Assignment: 8, Attendance: 9, Semester: 47, total: 80, grade: "A+", gradePoint: 4.0 },
      { subject: "HUM-2115", CT: 12, Assignment: 6, Attendance: 6, Semester: 40, total: 64, grade: "B",  gradePoint: 3.0 },
      { subject: "ETE-2117", CT: 13, Assignment: 7, Attendance: 8, Semester: 44, total: 72, grade: "A-", gradePoint: 3.5 },
    ],
  },
];

const MOCK_SUMMARY = {
  subjectPerformance: [
    { subject: "ETE-3111", avgMarks: 84.5 }, { subject: "ETE-3113", avgMarks: 74.5 },
    { subject: "ETE-3115", avgMarks: 87.5 }, { subject: "CSE-3154", avgMarks: 81.0 },
    { subject: "EEE-3153", avgMarks: 71.5 },
  ],
  gradeDistribution: { "A+": 7, "A": 5, "A-": 5, "B+": 2, "B": 2, "B-": 0, "C+": 0, "C": 0, "D": 0, "F": 0 },
};

// ── Isolated search + table — has its own state so parent never re-renders on keystrokes ──
const MarksTable = memo(({ docs, seriesFilter, onRefresh }) => {
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState({});

  const toggleExpand = useCallback(
    (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  const displayDocs = useMemo(() => {
    if (!search) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.roll?.toLowerCase().includes(q) ||
        d.studentName?.toLowerCase().includes(q)
    );
  }, [docs, search]);

  return (
    <div className="glow-card" style={{ padding: "20px 22px" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 2 }}>Student Marks Records</div>
          <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)" }}>
            {docs.length} students · Click a row to expand subject details
            {seriesFilter !== "All" && (
              <> · <span className={seriesPillClass(seriesFilter)} style={{ marginLeft: 4 }}>{seriesFilter}</span></>
            )}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ete-muted)" }} />
          <input
            type="text"
            placeholder="Search by roll or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm"
            style={{
              paddingLeft: 30,
              background: "var(--ete-surface)",
              border: "1px solid var(--ete-border)",
              color: "var(--ete-text)",
              borderRadius: 8,
              fontSize: "0.78rem",
              width: 210,
            }}
          />
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-sm btn-ghost"
          style={{ color: "var(--ete-muted)", borderRadius: 8 }}
        >
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
              <th>Avg Marks</th>
              <th>GPA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayDocs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--ete-muted)", padding: "32px" }}>
                  No records found
                </td>
              </tr>
            ) : (
              displayDocs.map((doc, idx) => {
                const totals = (doc.subjects || []).map((s) => s.total);
                const avgM   = totals.length
                  ? parseFloat((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1))
                  : 0;
                const gpa    = (doc.subjects || []).reduce((a, s) => a + (s.gradePoint || 0), 0) /
                               (doc.subjects?.length || 1);
                const isOpen = expanded[doc._id];

                return (
                  <>
                    <tr
                      key={doc._id}
                      onClick={() => toggleExpand(doc._id)}
                      style={{ cursor: "pointer", background: isOpen ? "rgba(0,201,167,0.03)" : undefined }}
                    >
                      <td className="mono" style={{ color: "var(--ete-muted)", fontSize: "0.75rem" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{doc.studentName}</td>
                      <td className="mono" style={{ color: "var(--ete-primary)", fontSize: "0.8rem" }}>{doc.roll}</td>
                      <td><span className={seriesPillClass(doc.series)}>{doc.series}</span></td>
                      <td style={{ fontSize: "0.8rem" }}>{doc.semester}</td>
                      <td>
                        <span
                          className="mono"
                          style={{ fontWeight: 700, color: avgM >= 75 ? "#00c9a7" : avgM >= 50 ? "#ffce56" : "#ff6b35" }}
                        >
                          {avgM}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "var(--ete-muted)", marginLeft: 2 }}>/100</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 700, color: "#a78bfa" }}>
                          {parseFloat(gpa.toFixed(2))}
                        </span>
                      </td>
                      <td style={{ color: "var(--ete-muted)" }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr key={doc._id + "-detail"}>
                        <td colSpan={8} style={{ padding: "0 16px 16px 16px", background: "rgba(0,201,167,0.02)" }}>
                          <div style={{ paddingTop: 12 }}>
                            <div style={{ marginBottom: 10, fontSize: "0.7rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                              Subject-wise breakdown
                            </div>
                            <div style={{ maxWidth: 580, marginBottom: 16 }}>
                              <MarksBreakdownBar data={doc.subjects || []} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
                              {(doc.subjects || []).map((sub) => (
                                <div
                                  key={sub.subject}
                                  style={{ background: "var(--ete-surface)", border: "1px solid var(--ete-border)", borderRadius: 10, padding: "12px 14px" }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="mono" style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--ete-primary)" }}>{sub.subject}</span>
                                    <span className={getGradeBadgeClass(sub.grade)}>{sub.grade}</span>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px", fontSize: "0.7rem", color: "var(--ete-muted)" }}>
                                    <span>CT: <strong style={{ color: "var(--ete-text)" }}>{sub.CT}/20</strong></span>
                                    <span>Assign: <strong style={{ color: "var(--ete-text)" }}>{sub.Assignment}/10</strong></span>
                                    <span>Att: <strong style={{ color: "var(--ete-text)" }}>{sub.Attendance}/10</strong></span>
                                    <span>Sem: <strong style={{ color: "var(--ete-text)" }}>{sub.Semester}/60</strong></span>
                                  </div>
                                  <div style={{ marginTop: 8, borderTop: "1px solid var(--ete-border)", paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "0.68rem", color: "var(--ete-muted)" }}>Total</span>
                                    <span
                                      className="mono"
                                      style={{ fontWeight: 800, color: sub.total >= 75 ? "#00c9a7" : sub.total >= 50 ? "#ffce56" : "#ff6b35" }}
                                    >
                                      {sub.total}/100
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.67rem", color: "#a78bfa", marginTop: 2, textAlign: "right" }}>GP: {sub.gradePoint}</div>
                                </div>
                              ))}
                            </div>
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
  );
});

// ── Memoised chart section — only re-renders when docs/summary change ──
const ChartsSection = memo(({ summary, performers, seriesFilter, performerMode, setPerformerMode }) => (
  <>
    <div className="two-col-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div className="glow-card" style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
          Grade Distribution {seriesFilter !== "All" ? `· ${seriesFilter}-Series` : "· All Series"}
        </div>
        <GradeDonut data={summary.gradeDistribution} />
      </div>
      <div className="glow-card" style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 16 }}>
          Subject Performance Radar {seriesFilter !== "All" ? `· ${seriesFilter}-Series` : ""}
        </div>
        <SubjectRadar data={summary.subjectPerformance} />
      </div>
    </div>

    <div className="glow-card" style={{ padding: "20px 22px" }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: "var(--ete-muted)", textTransform: "uppercase", fontWeight: 600 }}>
          {performerMode === "top" ? "Top Performers" : "Needs Attention"}
          {seriesFilter !== "All" && <span style={{ marginLeft: 6 }}>· {seriesFilter}-Series</span>}
        </div>
        <div className="flex gap-1">
          {["top", "bottom"].map((m) => (
            <button
              key={m}
              onClick={() => setPerformerMode(m)}
              style={{
                fontSize: "0.68rem", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                background: performerMode === m ? "rgba(0,201,167,0.15)" : "transparent",
                color:      performerMode === m ? "var(--ete-primary)" : "var(--ete-muted)",
                border:     performerMode === m ? "1px solid rgba(0,201,167,0.3)" : "1px solid transparent",
              }}
            >
              {m === "top" ? "Top 5" : "Bottom 5"}
            </button>
          ))}
        </div>
      </div>
      <PerformerChart
        students={performers.length ? performers : [{ name: "—", avgMarks: 0 }]}
        mode={performerMode}
      />
    </div>
  </>
));

// ── Main page ─────────────────────────────────────────────────
export default function Marks() {
  const { seriesFilter } = useSeriesFilter();
  const [docs, setDocs]           = useState([]);
  const [summary, setSummary]     = useState(MOCK_SUMMARY);
  const [loading, setLoading]     = useState(true);
  const [performerMode, setPerformerMode] = useState("top");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [marksRes, sumRes] = await Promise.all([
        fetchMarks(seriesFilter !== "All" ? seriesFilter : null),
        fetchMarksSummary(seriesFilter !== "All" ? seriesFilter : null),
      ]);
      setDocs(marksRes.data);
      setSummary(sumRes.data);
    } catch {
      const filtered =
        seriesFilter === "All"
          ? MOCK_DOCS
          : MOCK_DOCS.filter((d) => d.series === seriesFilter);
      setDocs(filtered);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [seriesFilter]);

  useEffect(() => { load(); }, [load]);

  // Computed only when docs change — NOT on search keystrokes
  const performers = useMemo(() =>
    docs.map((doc) => {
      const totals = (doc.subjects || []).map((s) => s.total);
      const avgM   = totals.length
        ? parseFloat((totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1))
        : 0;
      const gpa    = (doc.subjects || []).reduce((a, s) => a + (s.gradePoint || 0), 0) /
                     (doc.subjects?.length || 1);
      return { name: doc.studentName, roll: doc.roll, avgMarks: avgM, gpa: parseFloat(gpa.toFixed(2)) };
    }),
    [docs]
  );

  if (loading) return <LoadingSpinner text="Loading marks data..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Charts — completely isolated from search state */}
      <ChartsSection
        summary={summary}
        performers={performers}
        seriesFilter={seriesFilter}
        performerMode={performerMode}
        setPerformerMode={setPerformerMode}
      />

      {/* Table — search state lives here only, never bubbles up */}
      <MarksTable
        docs={docs}
        seriesFilter={seriesFilter}
        onRefresh={load}
      />
    </div>
  );
}