import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/StudentsPage";   // 👈 add
import ImportPage from "@/pages/ImportPage";       // 👈 if you have one

function NotFound() {
  return <div className="p-6">Not found. Try “Dashboard” from the menu.</div>;
function NotFound() {
  return <div className="p-6">Not found. Try “Dashboard” from the menu.</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* default route inside layout */}
        <Route index element={<Dashboard />} />
        {/* <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<StudentsPage />} />                {/* 👈 new */}
        <Route path="students/new" element={<div className="p-6">Add Student (next)</div>} />
        <Route path="students/:id/edit" element={<div className="p-6">Edit Student (next)</div>} />
        <Route path="import" element={<ImportPage />} />                    {/* optional */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  ); add more when ready:
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="import" element={<ImportPage />} />
        */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
