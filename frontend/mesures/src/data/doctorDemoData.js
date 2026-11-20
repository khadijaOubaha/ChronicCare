// DONNÉES FICTIVES (démonstration). Ne proviennent d'aucun backend.
export const DEMO_TODAY = '2026-11-13';

const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const serie = (base, amp, dia) =>
  Array.from({ length: 30 }, (_, i) => {
    const v = Math.round(base + amp * Math.sin(i * 1.1) + (i % 4));
    return { jour: addDays(DEMO_TODAY, i - 29), valeur: v, valeurSecondaire: dia ? v - dia : null };
  });

const GLY = { nom: 'Glycémie', unite: 'mg/dL', deuxValeurs: false, libelle: 'Glycémie' };
const TEN = { nom: 'Tension artérielle', unite: 'mmHg', deuxValeurs: true, libelle: 'Systolique', libelleSecondaire: 'Diastolique' };

function patient(id, firstName, lastName, disease, principal, courbe, poids) {
  const mesures = courbe.map((p) => ({
    jour: p.jour, heure: '08:10', type: principal.nom, unite: principal.unite,
    valeur: p.valeur, valeurSecondaire: p.valeurSecondaire,
  }));
  mesures.push(
    { jour: DEMO_TODAY, heure: '08:12', type: 'Poids', unite: 'kg', valeur: poids, valeurSecondaire: null },
    { jour: DEMO_TODAY, heure: '08:15', type: 'Température', unite: '°C', valeur: 36.8, valeurSecondaire: null }
  );
  mesures.sort((a, b) => (b.jour + b.heure).localeCompare(a.jour + a.heure));
  return { id, firstName, lastName, disease, principal, courbe, mesures };
}

export const PATIENTS = [
  patient('demo-1', 'Luc', 'Durand', 'diabetes_type_2', GLY, serie(112, 8), 82.4),
  patient('demo-2', 'Emma', 'Petit', 'hypertension', TEN, serie(128, 5, 45), 64.1),
  patient('demo-3', 'Robert', 'Morel', 'diabetes_type_2', GLY, serie(110, 6), 90.2),
  patient('demo-4', 'Sara', 'Benani', 'hypertension', TEN, serie(124, 4, 45), 58.7),
  patient('demo-5', 'Youssef', 'Alami', 'diabetes_type_2', GLY, serie(120, 9), 77.5),
  patient('demo-6', 'Nadia', 'Idrissi', 'hypertension', TEN, serie(118, 4, 42), 61.3),
];
