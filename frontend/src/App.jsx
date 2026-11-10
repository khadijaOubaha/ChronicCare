import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ROLES } from "./auth/roles";
import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PatientsPage from "./pages/PatientsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import RegisterPage from "./pages/RegisterPage";
import SuiviPage from "./pages/SuiviPage";
import TeleconsultationsPage from "./pages/TeleconsultationsPage";

const only = (role, element) => <ProtectedRoute roles={[role]}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="suivi" element={only(ROLES.PATIENT, <SuiviPage />)} />
        <Route path="patients" element={only(ROLES.DOCTOR, <PatientsPage />)} />
        <Route path="prescriptions" element={only(ROLES.DOCTOR, <PrescriptionsPage />)} />
        <Route path="teleconsultations" element={<TeleconsultationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
