import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout from "./components/Layout";
import DetailsPage from "./pages/DetailsPage";
import DoctorList from "./pages/DoctorList";
import Login from "./pages/Login";
import PatientList from "./pages/PatientList";
import RequestPage from "./pages/RequestPage";

export default function App() {
  const { user } = useAuth();
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  const isDoctor = user.role === "ADMIN";
  return (
    <Routes>
      <Route element={<Layout crumbs="Téléconsultations" />}>
        <Route path="/teleconsultations" element={isDoctor ? <DoctorList /> : <PatientList />} />
        <Route
          path="/teleconsultations/nouveau"
          element={isDoctor ? <Navigate to="/teleconsultations" replace /> : <RequestPage />}
        />
        <Route path="/teleconsultations/:id" element={<DetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/teleconsultations" replace />} />
    </Routes>
  );
}
