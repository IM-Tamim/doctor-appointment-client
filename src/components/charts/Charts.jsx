import ChartWrapper from "./ChartWrapper";

// ── Attendance bar by subject ─────────────────────────────────
// data: [{ subject, present, total, avgPct }]
export function AttendanceBarChart({ data }) {
  const pcts = data.map((d) =>
    d.avgPct !== undefined ? d.avgPct : Math.round((d.present / d.total) * 100)
  );
  return (
    <ChartWrapper
      type="bar"
      height={240}
      data={{
        labels: data.map((d) => d.subject),
        datasets: [{
          label: "Attendance %",
          data: pcts,
          backgroundColor: pcts.map((p) => p >= 75 ? "rgba(0,201,167,0.7)" : p >= 60 ? "rgba(255,206,86,0.7)" : "rgba(255,107,53,0.7)"),
          borderColor:      pcts.map((p) => p >= 75 ? "#00c9a7" : p >= 60 ? "#ffce56" : "#ff6b35"),
          borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
        }],
      }}
      options={{ scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } }, plugins: { tooltip: { callbacks: { label: (c) => ` ${c.parsed.y}%` } } } }}
    />
  );
}

// ── Attendance trend line (monthly) ───────────────────────────
// data: [{ month, pct }]
export function AttendanceTrendLine({ data }) {
  return (
    <ChartWrapper
      type="line"
      height={200}
      data={{
        labels: data.map((d) => d.month),
        datasets: [{
          label: "Attendance %",
          data: data.map((d) => d.pct),
          borderColor: "#4facfe", backgroundColor: "rgba(79,172,254,0.08)",
          tension: 0.45, fill: true,
          pointBackgroundColor: "#4facfe", pointBorderColor: "#0d1f35", pointBorderWidth: 2, pointRadius: 4,
        }],
      }}
      options={{ scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } } }}
    />
  );
}

// ── Subject avg marks bar ──────────────────────────────────────
// data: [{ subject, avgMarks }]
export function SubjectMarksBar({ data }) {
  return (
    <ChartWrapper
      type="bar"
      height={240}
      data={{
        labels: data.map((d) => d.subject),
        datasets: [{
          label: "Avg Marks",
          data: data.map((d) => d.avgMarks),
          backgroundColor: "rgba(79,172,254,0.7)",
          borderColor: "#4facfe",
          borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
        }],
      }}
      options={{ scales: { y: { min: 0, max: 100 } } }}
    />
  );
}

// ── Grade doughnut ────────────────────────────────────────────
// data: { "A+": n, A: n, "A-": n, "B+": n, B: n, ... F: n }
export function GradeDonut({ data }) {
  const aGroup = (data["A+"] || 0) + (data["A"] || 0) + (data["A-"] || 0);
  const bGroup = (data["B+"] || 0) + (data["B"] || 0) + (data["B-"] || 0);
  const cGroup = (data["C+"] || 0) + (data["C"] || 0) + (data["D"] || 0);
  const fGroup = data["F"] || 0;
  return (
    <ChartWrapper
      type="doughnut"
      height={220}
      data={{
        labels: ["A+/A/A-", "B+/B/B-", "C+/C/D", "Fail"],
        datasets: [{
          data: [aGroup, bGroup, cGroup, fGroup],
          backgroundColor: ["rgba(0,201,167,0.8)", "rgba(79,172,254,0.8)", "rgba(255,206,86,0.8)", "rgba(255,107,53,0.8)"],
          borderColor:      ["#00c9a7", "#4facfe", "#ffce56", "#ff6b35"],
          borderWidth: 1.5, hoverOffset: 6,
        }],
      }}
      options={{ cutout: "65%", plugins: { legend: { position: "right" } } }}
    />
  );
}

// ── Subject radar ─────────────────────────────────────────────
// data: [{ subject, avgMarks }]
export function SubjectRadar({ data }) {
  return (
    <ChartWrapper
      type="radar"
      height={280}
      data={{
        labels: data.map((d) => d.subject),
        datasets: [{
          label: "Avg Marks",
          data: data.map((d) => d.avgMarks),
          backgroundColor: "rgba(0,201,167,0.15)",
          borderColor: "#00c9a7", borderWidth: 2,
          pointBackgroundColor: "#00c9a7", pointBorderColor: "#0d1f35", pointBorderWidth: 2, pointRadius: 4,
        }],
      }}
      options={{
        scales: {
          r: {
            min: 0, max: 100,
            grid: { color: "rgba(255,255,255,0.06)" },
            angleLines: { color: "rgba(255,255,255,0.06)" },
            ticks: { color: "#7a8fa6", backdropColor: "transparent", font: { size: 9 }, stepSize: 25 },
            pointLabels: { color: "#7a8fa6", font: { size: 10, family: "'DM Mono', monospace" } },
          },
        },
      }}
    />
  );
}

// ── Performer horizontal bar ──────────────────────────────────
// students: [{ name, avgMarks }]
export function PerformerChart({ students, mode = "top" }) {
  const sorted = [...students].sort((a, b) => mode === "top" ? b.avgMarks - a.avgMarks : a.avgMarks - b.avgMarks);
  const top5   = sorted.slice(0, 5);
  return (
    <ChartWrapper
      type="bar"
      height={200}
      data={{
        labels: top5.map((s) => s.name),
        datasets: [{
          label: "Avg Marks",
          data: top5.map((s) => s.avgMarks),
          backgroundColor: mode === "top" ? "rgba(0,201,167,0.7)" : "rgba(255,107,53,0.7)",
          borderColor:     mode === "top" ? "#00c9a7" : "#ff6b35",
          borderWidth: 1.5, borderRadius: 6,
        }],
      }}
      options={{ indexAxis: "y", scales: { x: { min: 0, max: 100 } } }}
    />
  );
}

// ── Series student count bar ──────────────────────────────────
export function SeriesBarChart({ data }) {
  const colors = {
    "20": "rgba(167,139,250,0.7)", "21": "rgba(79,172,254,0.7)",
    "22": "rgba(0,201,167,0.8)",   "23": "rgba(255,206,86,0.7)",
    "24": "rgba(255,107,53,0.7)",
  };
  return (
    <ChartWrapper
      type="bar"
      height={220}
      data={{
        labels: data.map((d) => `${d.series}-Series`),
        datasets: [{
          label: "Students",
          data: data.map((d) => d.count),
          backgroundColor: data.map((d) => colors[d.series] || "rgba(0,201,167,0.7)"),
          borderColor:     data.map((d) => colors[d.series]?.replace(/0\.[78]\)/, "1)") || "#00c9a7"),
          borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
        }],
      }}
      options={{ scales: { y: { ticks: { stepSize: 10 } } }, plugins: { legend: { display: false } } }}
    />
  );
}

// ── Marks component breakdown bar for one student ─────────────
// data: [{ subject, CT, Assignment, Attendance, Semester }]
export function MarksBreakdownBar({ data }) {
  return (
    <ChartWrapper
      type="bar"
      height={260}
      data={{
        labels: data.map((d) => d.subject),
        datasets: [
          { label: "CT (20)",         data: data.map((d) => d.CT),         backgroundColor: "rgba(0,201,167,0.75)",  borderRadius: 4 },
          { label: "Assignment (10)", data: data.map((d) => d.Assignment),  backgroundColor: "rgba(79,172,254,0.75)", borderRadius: 4 },
          { label: "Attendance (10)", data: data.map((d) => d.Attendance),  backgroundColor: "rgba(255,206,86,0.75)", borderRadius: 4 },
          { label: "Semester (60)",   data: data.map((d) => d.Semester),    backgroundColor: "rgba(167,139,250,0.75)",borderRadius: 4 },
        ],
      }}
      options={{ scales: { x: { stacked: true }, y: { stacked: true, max: 100 } }, plugins: { legend: { position: "bottom", labels: { font: { size: 10 } } } } }}
    />
  );
}

// ── Attendance per-subject donut for one student ──────────────
// data: [{ subject, attendancePercentage }]
export function StudentAttendanceBar({ data }) {
  const colors = data.map((d) =>
    d.attendancePercentage >= 75 ? "rgba(0,201,167,0.7)" :
    d.attendancePercentage >= 60 ? "rgba(255,206,86,0.7)" : "rgba(255,107,53,0.7)"
  );
  return (
    <ChartWrapper
      type="bar"
      height={220}
      data={{
        labels: data.map((d) => d.subject),
        datasets: [{
          label: "Attendance %",
          data: data.map((d) => d.attendancePercentage),
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace("0.7", "1")),
          borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
        }],
      }}
      options={{ scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } } }}
    />
  );
}
