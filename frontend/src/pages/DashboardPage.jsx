import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../auth/roles";
import DoctorDashboard from "./DoctorDashboard";
import PatientDashboard from "./PatientDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  return user.role === ROLES.DOCTOR ? <DoctorDashboard /> : <PatientDashboard />;
}
