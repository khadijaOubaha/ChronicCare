// COUCHE MÉDECIN — DONNÉES DE DÉMONSTRATION UNIQUEMENT.
// Aucun appel réseau. Lors de l'intégration du backend médecin, seul ce fichier change :
// remplacer le contenu des fonctions par de vrais appels, en gardant la même forme de retour.
import { PATIENTS } from '../data/doctorDemoData';

const later = (v) => new Promise((r) => setTimeout(() => r(v), 200));

export const getDoctorPatients = () => later(PATIENTS);
export const getDoctorPatient = (id) => later(PATIENTS.find((p) => p.id === id) || null);
