
import { Activity, Eye, Search, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui/StateViews";

import { patientsApi } from "../../api/patientsApi";
import { fullName } from "../patients/patientUtils";
import { useAsync } from "../../hooks/useAsync";
import { ageFrom } from "../../utils/format";

const PAGE = 20;

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète de type 2",
  HYPERTENSION: "Hypertension artérielle",
};

export default function DoctorPatientsPage() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");

  const { data, loading, error, reload } = useAsync(
    () =>
      patientsApi.list({
        offset,
        limit: PAGE,
        search: query.trim() || undefined,
        status: statusFilter || undefined,
        disease: diseaseFilter || undefined,
      }),
    [offset, query, statusFilter, diseaseFilter]
  );

  const patients = data?.items ?? [];
  const total = data?.total ?? patients.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi des mesures"
        description={`Consultez les mesures et l'évolution de vos patients (${total} patient${total > 1 ? "s" : ""}).`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          icon={Search}
          placeholder="Rechercher un patient..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOffset(0);
          }}
        />

        <SelectField
          value={diseaseFilter}
          onChange={(e) => {
            setDiseaseFilter(e.target.value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "Toutes les pathologies" },
            { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
            { value: "HYPERTENSION", label: "Hypertension artérielle" },
          ]}
        />

        <SelectField
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "Tous les statuts" },
            { value: "active", label: "Patients actifs" },
            { value: "inactive", label: "Patients inactifs" },
          ]}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="Aucun patient trouvé"
          description={
            query || statusFilter || diseaseFilter
              ? "Aucun patient ne correspond à vos critères."
              : "Aucun patient n'est disponible pour le moment."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Âge et sexe</th>
                  <th className="px-5 py-3.5">Pathologie</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Consultation</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => {
                  const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();
                  const age = ageFrom(patient.date_of_birth);

                  return (
                    <tr
                      key={patient.id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                            {initials || <User className="h-4 w-4" />}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {fullName(patient)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {patient.email || "Email non renseigné"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span>{age ? `${age} ans` : "—"}</span>
                        <span className="block text-xs text-slate-400">
                          {patient.sex === "M"
                            ? "Homme"
                            : patient.sex === "F"
                              ? "Femme"
                              : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        {patient.disease ? (
                          <Badge tone="brand">
                            {DISEASE_LABELS[patient.disease] || patient.disease}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Non spécifiée
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge tone={patient.is_active ? "green" : "slate"}>
                          {patient.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <Link to={`/mesures-patients/${patient.id}`}>
                          <Button className="h-9 px-3 text-xs">
                            <Activity className="h-4 w-4" />
                            Consulter les mesures
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && total > PAGE && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Affichage de {offset + 1} à {Math.min(offset + PAGE, total)} sur {total} patients
          </span>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE))}
            >
              Précédent
            </Button>

            <Button
              variant="secondary"
              disabled={offset + PAGE >= total}
              onClick={() => setOffset(offset + PAGE)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
