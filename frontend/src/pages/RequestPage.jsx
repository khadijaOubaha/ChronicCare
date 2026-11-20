import { ArrowLeft, CalendarClock, CheckCircle2, Send, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { tokenStorage } from "../auth/tokenStorage";
import { Avatar } from "../components/Common";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import TextAreaField from "../components/ui/TextAreaField";
import TextField from "../components/ui/TextField";
import { DOCTORS } from "../data/doctors";
import { localInputToIso } from "../lib/tele";

export default function RequestPage() {
  const { user, loading } = useAuth();
  const token = tokenStorage.get();
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState(DOCTORS[0].id);
  const [notes, setNotes] = useState("");
  const [wanted, setWanted] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (loading || !token || !user?.id) {
      setError("Votre session n'est pas encore prête. Veuillez réessayer.");
      return;
    }
    setError("");
    if (!notes.trim()) return setError("Indiquez le motif de la consultation.");
    setBusy(true);
    try {
      await api.request(token, {
        doctor_id: doctorId,
        notes: notes.trim(),
        ...(wanted ? { scheduled_at: localInputToIso(wanted) } : {}),
      });
      setSent(true);
      setTimeout(() => navigate("/teleconsultations"), 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Prendre un rendez-vous"
        description="Choisissez un médecin, une spécialité et envoyez une demande de rendez-vous."
        actions={
          <Link to="/teleconsultations">
            <Button type="button" variant="secondary"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Retour</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-sm text-white">1</span>
              Choisir un médecin
            </h2>
            {DOCTORS.map((d) => {
              const on = d.id === doctorId;
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${on ? "border-brand-500 ring-2 ring-brand-500/30" : "border-slate-200"}`}
                >
                  <Avatar name={d.name} size={52} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.specialty}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                      <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" /> {d.rating} ({d.reviews} avis)
                    </p>
                  </div>
                  <Button type="button" variant={on ? "primary" : "secondary"} className="h-9 px-3" onClick={() => setDoctorId(d.id)}>
                    {on ? (<><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Sélectionné</>) : "Sélectionner"}
                  </Button>
                </div>
              );
            })}
          </section>

          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-sm text-white">2</span>
              Motif de la consultation
            </h2>
            <TextAreaField
              label="Motif"
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex. : Contrôle de la glycémie et ajustement du traitement"
            />
            <TextField label="Date souhaitée (facultatif)" type="datetime-local" value={wanted} onChange={(e) => setWanted(e.target.value)} />
          </Card>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-brand-900 p-6 text-white">
            <CalendarClock className="h-10 w-10 text-brand-500" aria-hidden="true" />
            <p className="mt-3 font-bold">Votre demande sera transmise au médecin</p>
            <p className="mt-2 text-sm text-slate-300">Vous serez informé dès que votre rendez-vous sera confirmé par le médecin.</p>
          </div>
          {error && <Alert>{error}</Alert>}
          {sent && <Alert type="success">Demande envoyée. Redirection…</Alert>}
          <Button type="button" className="w-full" onClick={submit} loading={busy} disabled={sent}>
            {!busy && <Send className="h-4 w-4" aria-hidden="true" />} {busy ? "Envoi…" : "Envoyer ma demande"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
