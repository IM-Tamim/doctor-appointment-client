import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SeriesProvider } from "./context/SeriesContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Marks from "./pages/Marks";
import Students from "./pages/Students";
import Reports from "./pages/Reports";

function App() {
  return (
    <ThemeProvider>
      <SeriesProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/students"   element={<Students />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/marks"      element={<Marks />} />
              <Route path="/reports"    element={<Reports />} />
            </Routes>
          </Layout>
        </Router>
      </SeriesProvider>
    </ThemeProvider>
  );
}

export default App;
