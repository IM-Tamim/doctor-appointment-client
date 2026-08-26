import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { LoadingSpinner } from "../components/ui/States";
import { fetchStudents, addStudent, deleteStudent } from "../utils/api";
import { SERIES, SERIES_SEMESTER, BLOOD_GROUPS, seriesPillClass, formatDate } from "../utils/helpers";

const MOCK_STUDENTS = [
  { _id: "1", name: "FATIN AWSAF AMIN",      gender: "Male",   dateOfBirth: "13/04/2005", bloodGroup: "O+", email: "fatin.official2023@gmail.com",     phone: "01770917975", fatherName: "Md. Al Wadud Amin",   motherName: "Fahima Khanam",  religion: "Islam", roll: "2204001", registrationNo: "725", series: "22", semester: "5th", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
  { _id: "2", name: "SHEIKH TANJIM AHMED",   gender: "Male",   dateOfBirth: "02/01/2004", bloodGroup: "O+", email: "sheikhtanjimahmedsoron@gmail.com", phone: "01812345678", fatherName: "Sheikh Rafiqul Islam", motherName: "Nasima Begum",   religion: "Islam", roll: "2204002", registrationNo: "726", series: "22", semester: "5th", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
  { _id: "3", name: "AFIFA TASNIM HAQUE",    gender: "Female", dateOfBirth: "13/11/2004", bloodGroup: "A+", email: "afifatasnimhaque@gmail.com",       phone: "01923456789", fatherName: "Md. Zahirul Haque",   motherName: "Shirin Akter",   religion: "Islam", roll: "2204004", registrationNo: "728", series: "22", semester: "5th", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
  { _id: "4", name: "MOST. NAFISA TABASSUM", gender: "Female", dateOfBirth: "25/03/2005", bloodGroup: "O+", email: "nafisa1634@gmail.com",             phone: "01734567890", fatherName: "Md. Nurul Islam",     motherName: "Murshida Khatun",religion: "Islam", roll: "2204005", registrationNo: "729", series: "22", semester: "5th", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
  { _id: "5", name: "RAFIUL HASAN",          gender: "Male",   dateOfBirth: "12/03/2002", bloodGroup: "O+", email: "rafiul.hasan20@gmail.com",         phone: "01645678901", fatherName: "Md. Rezaul Hasan",    motherName: "Razia Begum",    religion: "Islam", roll: "2004001", registrationNo: "601", series: "20", semester: "8th", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
  { _id: "6", name: "MAHMUDUL HASAN",        gender: "Male",   dateOfBirth: "05/05/2005", bloodGroup: "B+", email: "mahmudul.hasan23@gmail.com",       phone: "01556789012", fatherName: "Md. Abdus Salam",     motherName: "Amena Begum",    religion: "Islam", roll: "2304001", registrationNo: "801", series: "23", semester: "3rd", section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active" },
];

const FORM_DEFAULT = {
  name: "", gender: "Male", dateOfBirth: "", bloodGroup: "O+",
  email: "", phone: "", fatherName: "", motherName: "", religion: "Islam",
  roll: "", registrationNo: "", series: "22", semester: "5th",
  section: "A", shift: "Day", group: "ETE", studentCategory: "Regular", status: "active",
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(FORM_DEFAULT);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [seriesFilter, setSeriesFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchStudents(seriesFilter === "All" ? null : seriesFilter);
      setStudents(res.data);
    } catch {
      setStudents(MOCK_STUDENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [seriesFilter]);

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.roll?.toLowerCase().includes(q) ||
      s.registrationNo?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const seriesCounts = SERIES.map((s) => ({
    series: s,
    count: students.filter((st) => st.series === s).length,
  }));

  const handleAdd = async () => {
    if (!form.name || !form.roll) return;
    setSaving(true);
    try {
      const res = await addStudent(form);
      setStudents((prev) => [res.data, ...prev]);
    } catch {
      setStudents((prev) => [{ ...form, _id: Date.now().toString() }, ...prev]);
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm(FORM_DEFAULT);
    }
  };

  const handleDelete = async (id) => {
    try { await deleteStudent(id); } catch {}
    setStudents((prev) => prev.filter((s) => s._id !== id));
  };

  const handleSeriesChange = (val) => {
    setForm({ ...form, series: val, semester: SERIES_SEMESTER[val] || "" });
  };

  if (loading) return <LoadingSpinner text="Loading student registry..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Series count cards — no series 25 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {seriesCounts.map(({ series, count }) => (
          <div
            key={series}
            className="glow-card"
            style={{ padding: "14px 16px", cursor: "pointer", borderColor: seriesFilter === series ? "rgba(0,201,167,0.4)" : undefined }}
            onClick={() => setSeriesFilter(seriesFilter === series ? "All" : series)}
          >
            <div style={{ fontSize: "0.6rem", color: "var(--ete-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>
              {series}-Series
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "'DM Mono',monospace", color: series === "22" ? "#00c9a7" : "#4facfe" }}>
              {count}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--ete-muted)", marginTop: 2 }}>{SERIES_SEMESTER[series]} Sem</div>
            {series === "22" && <div style={{ fontSize: "0.58rem", color: "var(--ete-primary)", fontWeight: 700, marginTop: 4 }}>★ FOCUS</div>}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glow-card" style={{ padding: "20px 22px" }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 2 }}>Student Registry</div>
            <div style={{ fontSize: "0.72rem", color: "var(--ete-muted)" }}>
              Showing <span style={{ color: "var(--ete-primary)", fontWeight: 700 }}>{filtered.length}</span> students
              {seriesFilter !== "All" && <> — <span style={{ color: "var(--ete-primary)" }}>{seriesFilter}-Series</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ete-muted)" }} />
              <input
                type="text" placeholder="Name / Roll / Reg..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm"
                style={{ paddingLeft: 30, background: "var(--ete-surface)", border: "1px solid var(--ete-border)", color: "var(--ete-text)", borderRadius: 8, fontSize: "0.78rem", width: 180 }}
              />
            </div>
            <select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} className="select select-sm"
              style={{ background: "var(--ete-surface)", color: "var(--ete-text)", border: "1px solid var(--ete-border)", borderRadius: 8, fontSize: "0.78rem" }}>
              <option value="All">All Series</option>
              {SERIES.map((s) => <option key={s} value={s}>{s}-Series</option>)}
            </select>
            <button onClick={load} className="btn btn-sm btn-ghost" style={{ color: "var(--ete-muted)", borderRadius: 8 }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowForm(!showForm)} className="btn btn-sm"
              style={{ background: "rgba(0,201,167,0.15)", color: "var(--ete-primary)", border: "1px solid rgba(0,201,167,0.3)", borderRadius: 8, gap: 6 }}>
              <Plus size={14} /> Add Student
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: "var(--ete-surface)", border: "1px solid var(--ete-border)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {[
              { key: "name",           label: "Full Name",        type: "text"  },
              { key: "roll",           label: "Roll Number",      type: "text"  },
              { key: "registrationNo", label: "Registration No",  type: "text"  },
              { key: "email",          label: "Email",            type: "email" },
              { key: "phone",          label: "Phone",            type: "text"  },
              { key: "dateOfBirth",    label: "Date of Birth",    type: "text", placeholder: "DD/MM/YYYY" },
              { key: "fatherName",     label: "Father Name",      type: "text"  },
              { key: "motherName",     label: "Mother Name",      type: "text"  },
              { key: "religion",       label: "Religion",         type: "text"  },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: "0.68rem", color: "var(--ete-muted)", display: "block", marginBottom: 4 }}>{label}</label>
                <input type={type} placeholder={placeholder || ""} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input input-sm w-full"
                  style={{ background: "var(--ete-card)", border: "1px solid var(--ete-border)", color: "var(--ete-text)", borderRadius: 8, fontSize: "0.82rem" }} />
              </div>
            ))}
            {[
              { key: "gender",          label: "Gender",          opts: ["Male", "Female"] },
              { key: "bloodGroup",      label: "Blood Group",     opts: BLOOD_GROUPS },
              { key: "section",         label: "Section",         opts: ["A", "B"] },
              { key: "shift",           label: "Shift",           opts: ["Day", "Evening"] },
              { key: "studentCategory", label: "Category",        opts: ["Regular", "Irregular"] },
              { key: "status",          label: "Status",          opts: ["active", "inactive"] },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <label style={{ fontSize: "0.68rem", color: "var(--ete-muted)", display: "block", marginBottom: 4 }}>{label}</label>
                <select value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="select select-sm w-full"
                  style={{ background: "var(--ete-card)", border: "1px solid var(--ete-border)", color: "var(--ete-text)", borderRadius: 8, fontSize: "0.82rem" }}>
                  {opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={{ fontSize: "0.68rem", color: "var(--ete-muted)", display: "block", marginBottom: 4 }}>Series</label>
              <select value={form.series} onChange={(e) => handleSeriesChange(e.target.value)}
                className="select select-sm w-full"
                style={{ background: "var(--ete-card)", border: "1px solid var(--ete-border)", color: "var(--ete-text)", borderRadius: 8, fontSize: "0.82rem" }}>
                {SERIES.map((s) => <option key={s} value={s}>{s}-Series</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.68rem", color: "var(--ete-muted)", display: "block", marginBottom: 4 }}>Semester (auto)</label>
              <input readOnly value={form.semester} className="input input-sm w-full"
                style={{ background: "var(--ete-surface)", border: "1px solid var(--ete-border)", color: "var(--ete-muted)", borderRadius: 8, fontSize: "0.82rem" }} />
            </div>
            <div className="flex items-end gap-2" style={{ gridColumn: "1 / -1" }}>
              <button onClick={handleAdd} disabled={saving} className="btn btn-sm"
                style={{ background: "rgba(0,201,167,0.2)", color: "var(--ete-primary)", border: "1px solid rgba(0,201,167,0.3)", borderRadius: 8 }}>
                {saving ? "Saving..." : "Save Student"}
              </button>
              <button onClick={() => { setShowForm(false); setForm(FORM_DEFAULT); }} className="btn btn-sm btn-ghost"
                style={{ color: "var(--ete-muted)", borderRadius: 8 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="ete-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Blood</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Roll</th>
                <th>Reg. No</th>
                <th>Series</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={14} style={{ textAlign: "center", color: "var(--ete-muted)", padding: "32px" }}>No students found</td></tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s._id}>
                    <td className="mono" style={{ color: "var(--ete-muted)", fontSize: "0.75rem" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                    <td><span className={s.gender === "Female" ? "badge-female" : "badge-male"}>{s.gender}</span></td>
                    <td className="mono" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>{s.dateOfBirth || "—"}</td>
                    <td className="mono" style={{ fontWeight: 700, color: "#4facfe", fontSize: "0.8rem" }}>{s.bloodGroup}</td>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--ete-muted)" }}>{s.phone || "—"}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--ete-muted)" }}>{s.email}</td>
                    <td className="mono" style={{ color: "var(--ete-primary)", fontSize: "0.8rem" }}>{s.roll}</td>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--ete-muted)" }}>{s.registrationNo}</td>
                    <td><span className={seriesPillClass(s.series)}>{s.series}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>{s.semester}</td>
                    <td style={{ fontSize: "0.8rem" }}>{s.section || "—"}</td>
                    <td><span className={s.status === "active" ? "badge-active" : "badge-inactive"}>{s.status}</span></td>
                    <td>
                      <button onClick={() => handleDelete(s._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ete-muted)", padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
