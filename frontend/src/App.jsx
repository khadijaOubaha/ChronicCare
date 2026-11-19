
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

// Module Mesures - Patient
import MesuresLayout from "./features/mesures/MesuresLayout";
import TodayPage from "./features/mesures/TodayPage";
import AddMeasurePage from "./features/mesures/AddMeasurePage";
import HistoryPage from "./features/mesures/HistoryPage";
import EvolutionPage from "./features/mesures/EvolutionPage";

// Module Mesures - Médecin
import DoctorPatientsPage from "./features/doctor-measures/DoctorPatientsPage";
import DoctorPatientDetailPage from "./features/doctor-measures/DoctorPatientDetailPage";

const only = (role, element) => (
  <ProtectedRoute roles={[role]}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Routes protégées */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Profil et sécurité */}
        <Route path="profil" element={<ProfilePage />} />
        <Route path="securite" element={<SecurityPage />} />

        {/* Espace patient */}
        <Route path="suivi" element={only(ROLES.PATIENT, <SuiviPage />)} />

        <Route element={only(ROLES.PATIENT, <MesuresLayout />)}>
          <Route path="mesures" element={<TodayPage />} />
          <Route path="mesures/saisir" element={<AddMeasurePage />} />
          <Route path="mesures/historique" element={<HistoryPage />} />
          <Route path="mesures/evolution" element={<EvolutionPage />} />
        </Route>

        {/* Espace médecin - Patients */}
        <Route path="patients" element={only(ROLES.DOCTOR, <PatientsPage />)} />
        <Route path="patients/nouveau" element={only(ROLES.DOCTOR, <AddPatientPage />)} />
        <Route path="patients/:id" element={only(ROLES.DOCTOR, <PatientDetailsPage />)} />
        <Route path="patients/:id/modifier" element={only(ROLES.DOCTOR, <EditPatientPage />)} />
        <Route path="patients/:id/dossier" element={only(ROLES.DOCTOR, <MedicalRecordPage />)} />

        {/* Espace médecin - Mesures */}
        <Route
          path="mesures-patients"
          element={only(ROLES.DOCTOR, <DoctorPatientsPage />)}
        />
        <Route
          path="mesures-patients/:id"
          element={only(ROLES.DOCTOR, <DoctorPatientDetailPage />)}
        />

        {/* Prescriptions et traitements */}
        <Route path="prescriptions" element={only(ROLES.DOCTOR, <PrescriptionsPage />)} />
        <Route path="prescriptions/nouveau" element={only(ROLES.DOCTOR, <AddTreatmentPage />)} />
        <Route path="prescriptions/:id" element={only(ROLES.DOCTOR, <TreatmentDetailsPage />)} />
        <Route path="prescriptions/:id/modifier" element={only(ROLES.DOCTOR, <EditTreatmentPage />)} />

        {/* Téléconsultations */}
        <Route path="teleconsultations" element={<TeleconsultationsPage />} />
      </Route>

      {/* Redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
