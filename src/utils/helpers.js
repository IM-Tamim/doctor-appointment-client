// No series 25 — removed per spec
export const SERIES = ["20", "21", "22", "23", "24"];

export const SERIES_SEMESTER = {
  "20": "8th",
  "21": "7th",
  "22": "5th",
  "23": "3rd",
  "24": "2nd",
};

export const SERIES_SUBJECTS = {
  "22": ["ETE-3111", "ETE-3113", "ETE-3115", "CSE-3154", "EEE-3153"],
  "23": ["ETE-2111", "ETE-2113", "CSE-2153", "HUM-2115", "ETE-2117"],
  "24": ["ETE-1110", "ETE-1113", "HUM-1115", "ETE-1111", "EEE-1153"],
  "21": ["ETE-4110", "ETE-4111", "ETE-4112", "ETE-4113", "CSE-4153"],
  "20": ["ETE-4210", "ETE-4211", "ETE-4213", "ETE-4215", "ETE-4217"],
};

export const ALL_SUBJECTS = [...new Set(Object.values(SERIES_SUBJECTS).flat())].sort();

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const getGrade = (total) => {
  if (total >= 80) return { grade: "A+", gradePoint: 4.0 };
  if (total >= 75) return { grade: "A",  gradePoint: 3.75 };
  if (total >= 70) return { grade: "A-", gradePoint: 3.5 };
  if (total >= 65) return { grade: "B+", gradePoint: 3.25 };
  if (total >= 60) return { grade: "B",  gradePoint: 3.0 };
  if (total >= 55) return { grade: "B-", gradePoint: 2.75 };
  if (total >= 50) return { grade: "C+", gradePoint: 2.5 };
  if (total >= 45) return { grade: "C",  gradePoint: 2.25 };
  if (total >= 40) return { grade: "D",  gradePoint: 2.0 };
  return { grade: "F", gradePoint: 0.0 };
};

export const getGradeBadgeClass = (grade) => {
  if (!grade) return "";
  if (grade.startsWith("A")) return "badge-grade-a";
  if (grade.startsWith("B")) return "badge-grade-b";
  if (grade.startsWith("C") || grade.startsWith("D")) return "badge-grade-c";
  return "badge-grade-f";
};

export const getAttendanceColor = (pct) => {
  if (pct >= 75) return "#00c9a7";
  if (pct >= 60) return "#ffce56";
  return "#ff6b35";
};

export const seriesPillClass = (s) => `series-pill s${s}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const avg = (arr) =>
  arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
