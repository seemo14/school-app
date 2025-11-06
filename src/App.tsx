import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/StudentsPage";
import AddStudentPage from "@/pages/AddStudentPage";   // 👈 add this
// import ImportPage from "@/pages/ImportPage";        // keep/remove per your setup

function NotFound() {
  return <div className="p-6">Not found. Try “Dashboard” from the menu.</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/new" element={<AddStudentPage />} /> {/* 👈 replace placeholder */}
        {/* <Route path="import" element={<ImportPage />} /> */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
