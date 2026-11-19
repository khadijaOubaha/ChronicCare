import ComingSoon from "../components/ui/ComingSoon";
import PageHeader from "../components/ui/PageHeader";

// Aucun service de téléconsultation dans le backend (Auth, Patients, Treatments).
export default function TeleconsultationsPage() {
  return (
    <div>
      <PageHeader title="Mes téléconsultations" description="Rendez-vous et salles de consultation virtuelles." />
      <ComingSoon items={["prise de rendez-vous", "liste des sessions", "salle de consultation vidéo"]} />
    </div>
  );
}
