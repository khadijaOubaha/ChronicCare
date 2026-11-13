import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MesuresProvider } from './context/MesuresContext';
import AppLayout from './components/layout/AppLayout';
import PatientLayout from './components/layout/PatientLayout';

import TodayPage from './pages/patient/TodayPage';
import AddMeasurePage from './pages/patient/AddMeasurePage';
import HistoryPage from './pages/patient/HistoryPage';
import EvolutionPage from './pages/patient/EvolutionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Rubriques avec contenu vide */}
        <Route
          path="/dashboard"
          element={<AppLayout crumbs={['Tableau de bord']} />}
        />

        <Route
          path="/traitement"
          element={<AppLayout crumbs={['Traitement']} />}
        />

        <Route
          path="/teleconsultations"
          element={<AppLayout crumbs={['Téléconsultations']} />}
        />

        {/* Module Mesures : pages existantes conservées */}
        <Route
          path="/patient/mesures"
          element={
            <MesuresProvider>
              <PatientLayout />
            </MesuresProvider>
          }
        >
          <Route index element={<TodayPage />} />
          <Route path="saisir" element={<AddMeasurePage />} />
          <Route path="historique" element={<HistoryPage />} />
          <Route path="evolution" element={<EvolutionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}