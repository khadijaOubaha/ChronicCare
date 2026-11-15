// Annuaire des médecins (DONNÉES DE DÉVELOPPEMENT).
// Le Teleconsultations Service ne stocke que doctor_id, et l'Auth Service ne
// fournit pas encore de liste de médecins : spécialité, note, cabinet et avis
// viennent donc de ce fichier. À remplacer par un appel API quand il existera.
// L'id de chaque médecin est l'UUID (claim "sub") de son compte ADMIN.
export const DOCTORS = [
  {
    key: "medecin",
    id: "11111111-1111-4111-a111-111111111111",
    name: "Dr. Ahlam El Fadli",
    specialty: "Endocrinologie",
    rating: 4.9,
    reviews: 76,
    office: "Cabinet ChronicCare, Agadir",
  },
  {
    key: "sarah.martin",
    id: "22222222-2222-4222-a222-222222222222",
    name: "Dr. Sarah Martin",
    specialty: "Cardiologue",
    rating: 4.8,
    reviews: 120,
    office: "Cabinet ChronicCare, Agadir",
  },
  {
    key: "jean.dupont",
    id: "33333333-3333-4333-a333-333333333333",
    name: "Dr. Jean Dupont",
    specialty: "Médecin Généraliste",
    rating: 4.7,
    reviews: 98,
    office: "Cabinet ChronicCare, Agadir",
  },
  {
    key: "marie.lefevre",
    id: "44444444-4444-4444-a444-444444444444",
    name: "Dr. Marie Lefèvre",
    specialty: "Endocrinologue",
    rating: 4.9,
    reviews: 76,
    office: "Cabinet ChronicCare, Agadir",
  },
];

export const doctorById = (id) => DOCTORS.find((d) => d.id === id) || null;

export function initials(name) {
  return (
    name
      .replace(/^Dr\.?\s+/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "?"
  );
}
