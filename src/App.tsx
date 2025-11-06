import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import StudentsPage from "@/pages/StudentsPage";


function NotFound() {
  return <div className="p-6">Not found. Try “Dashboard” from the menu.</div>;
}

export default function App() {
  return (
    <Routes>
     
        {/* default route inside layout */}
        <Route index element={<Dashboard />} />

        {/* pages */}
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/new" element={<div className="p-6">Add Student (next)</div>} />
        <Route path="students/:id/edit" element={<div className="p-6">Edit Student (next)</div>} />
        <Route path="import" element={<ImportPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
