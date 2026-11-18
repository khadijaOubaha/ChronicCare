import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ROLES } from "./auth/roles";
import AppLayout from "./layouts/AppLayout";
import AddPatientPage from "./pages/AddPatientPage";
import AddTreatmentPage from "./pages/AddTreatmentPage";
import DashboardPage from "./pages/DashboardPage";
import EditPatientPage from "./pages/EditPatientPage";
import EditTreatmentPage from "./pages/EditTreatmentPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import MedicalRecordPage from "./pages/MedicalRecordPage";
import PatientDetailsPage from "./pages/PatientDetailsPage";
import PatientsPage from "./pages/PatientsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SecurityPage from "./pages/SecurityPage";
import SuiviPage from "./pages/SuiviPage";
import TeleconsultationsPage from "./pages/TeleconsultationsPage";
import TreatmentDetailsPage from "./pages/TreatmentDetailsPage";

const only = (role, element) => (
  <ProtectedRoute roles={[role]}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Routes Publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Routes Protégées sous le Layout Principal */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Profil & Sécurité partagés */}
        <Route path="profil" element={<ProfilePage />} />
        <Route path="securite" element={<SecurityPage />} />

        {/* Espace Patient */}
        <Route path="suivi" element={only(ROLES.PATIENT, <SuiviPage />)} />

        {/* Espace Médecin : Gestion des Patients */}
        <Route path="patients" element={only(ROLES.DOCTOR, <PatientsPage />)} />
        <Route path="patients/nouveau" element={only(ROLES.DOCTOR, <AddPatientPage />)} />
        <Route path="patients/:id" element={only(ROLES.DOCTOR, <PatientDetailsPage />)} />
        <Route path="patients/:id/modifier" element={only(ROLES.DOCTOR, <EditPatientPage />)} />
        <Route path="patients/:id/dossier" element={only(ROLES.DOCTOR, <MedicalRecordPage />)} />

        {/* Prescriptions & Traitements */}
        <Route path="prescriptions" element={only(ROLES.DOCTOR, <PrescriptionsPage />)} />
        <Route path="prescriptions/nouveau" element={only(ROLES.DOCTOR, <AddTreatmentPage />)} />
        <Route path="prescriptions/:id" element={<TreatmentDetailsPage />} />
        <Route path="prescriptions/:id/modifier" element={only(ROLES.DOCTOR, <EditTreatmentPage />)} />

        {/* Téléconsultations */}
        <Route path="teleconsultations" element={<TeleconsultationsPage />} />
      </Route>

      {/* Redirection fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
