import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';

export default function DoctorLayout() {
  const [last, setLast] = useState(null); // la page détail y met le nom du patient
  return (
    <AppLayout user={{ name: 'Dr. Ahlam', role: 'Médecin', initials: 'DA' }} crumbs={['Patients', last || 'Suivi des mesures']}>
      <Outlet context={{ setLast }} />
    </AppLayout>
  );
}
