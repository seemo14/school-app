import { Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";

function NotFound() {
  return <div className="p-6">Not found. Try “Dashboard” from the menu.</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* default route inside layout */}
        <Route index element={<Dashboard />} />
        {/* add more when ready:
            <Route path="groups" element={<Groups />} />
            <Route path="groups/:id" element={<GroupDetail />} />
            <Route path="import" element={<ImportPage />} />
        */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
