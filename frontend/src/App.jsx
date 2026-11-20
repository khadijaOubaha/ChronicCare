
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./auth/AuthContext";
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
import TreatmentDetailsPage from "./pages/TreatmentDetailsPage";

import MesuresLayout from "./features/mesures/MesuresLayout";
import TodayPage from "./features/mesures/TodayPage";
import AddMeasurePage from "./features/mesures/AddMeasurePage";
import HistoryPage from "./features/mesures/HistoryPage";
import EvolutionPage from "./features/mesures/EvolutionPage";

import DoctorPatientsPage from "./features/doctor-measures/DoctorPatientsPage";
import DoctorPatientDetailPage from "./features/doctor-measures/DoctorPatientDetailPage";

import DoctorList from "./pages/DoctorList";
import PatientList from "./pages/PatientList";
import RequestPage from "./pages/RequestPage";
import DetailsPage from "./pages/DetailsPage";

const only = (role, element) => (
  <ProtectedRoute roles={[role]}>{element}</ProtectedRoute>
);

function TeleconsultationsHome() {
  const { user } = useAuth();

  return user?.role === ROLES.DOCTOR ? <DoctorList /> : <PatientList />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="profil" element={<ProfilePage />} />
        <Route path="securite" element={<SecurityPage />} />

        <Route path="suivi" element={only(ROLES.PATIENT, <SuiviPage />)} />

        <Route element={only(ROLES.PATIENT, <MesuresLayout />)}>
          <Route path="mesures" element={<TodayPage />} />
          <Route path="mesures/saisir" element={<AddMeasurePage />} />
          <Route path="mesures/historique" element={<HistoryPage />} />
          <Route path="mesures/evolution" element={<EvolutionPage />} />
        </Route>

        <Route path="patients" element={only(ROLES.DOCTOR, <PatientsPage />)} />
        <Route path="patients/nouveau" element={only(ROLES.DOCTOR, <AddPatientPage />)} />
        <Route path="patients/:id" element={only(ROLES.DOCTOR, <PatientDetailsPage />)} />
        <Route path="patients/:id/modifier" element={only(ROLES.DOCTOR, <EditPatientPage />)} />
        <Route path="patients/:id/dossier" element={only(ROLES.DOCTOR, <MedicalRecordPage />)} />

        <Route
          path="mesures-patients"
          element={only(ROLES.DOCTOR, <DoctorPatientsPage />)}
        />
        <Route
          path="mesures-patients/:id"
          element={only(ROLES.DOCTOR, <DoctorPatientDetailPage />)}
        />

        <Route path="prescriptions" element={only(ROLES.DOCTOR, <PrescriptionsPage />)} />
        <Route path="prescriptions/nouveau" element={only(ROLES.DOCTOR, <AddTreatmentPage />)} />
        <Route path="prescriptions/:id" element={only(ROLES.DOCTOR, <TreatmentDetailsPage />)} />
        <Route path="prescriptions/:id/modifier" element={only(ROLES.DOCTOR, <EditTreatmentPage />)} />

        <Route path="teleconsultations" element={<TeleconsultationsHome />} />
        <Route
          path="teleconsultations/nouveau"
          element={only(ROLES.PATIENT, <RequestPage />)}
        />
        <Route path="teleconsultations/:id" element={<DetailsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
