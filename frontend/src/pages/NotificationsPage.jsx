

import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../auth/roles";
import { remindersApi } from "../api/remindersApi";
import { patientsApi } from "../api/patientsApi";

import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";

const TYPE_LABELS = {
  treatment: "Traitement",
  "treatment.created": "Nouveau traitement",
  "treatment.updated": "Traitement modifié",
  "measurement.abnormal": "Mesure anormale",
  "teleconsultation.scheduled": "Téléconsultation",
};

function notificationIcon(type) {
  if (type?.includes("abnormal")) return AlertTriangle;
  if (type?.includes("teleconsultation")) return Calendar;
  return Info;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const isDoctor = user?.role === ROLES.DOCTOR;

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(isDoctor);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Charger les patients pour le médecin.
  useEffect(() => {
    if (!isDoctor) {
      setPatientsLoading(false);
      return;
    }

    let active = true;

    patientsApi
      .list({ limit: 100, offset: 0 })
      .then((data) => {
        if (!active) return;

        const items = data?.items ?? (Array.isArray(data) ? data : []);
        setPatients(items);

        if (items.length > 0) {
          setPatientId(items[0].id);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Impossible de charger la liste des patients."
          );
        }
      })
      .finally(() => {
        if (active) setPatientsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isDoctor]);

  // Charger les notifications selon le rôle et le filtre.
  const loadNotifications = useCallback(async () => {
    if (isDoctor && !patientId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await remindersApi.list({
        patientId: isDoctor ? patientId : undefined,
        limit: 50,
        offset: 0,
        unreadOnly: filter === "unread",
      });

      setNotifications(data?.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Impossible de récupérer les notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [isDoctor, patientId, filter]);

  useEffect(() => {
    if (isDoctor && patientsLoading) return;
    loadNotifications();
  }, [isDoctor, patientsLoading, loadNotifications]);

  const markAsRead = async (notificationId) => {
    setUpdatingId(notificationId);
    setActionError("");

    try {
      await remindersApi.markAsRead(notificationId);

      if (filter === "unread") {
        setNotifications((current) =>
          current.filter((item) => item.id !== notificationId)
        );
      } else {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notificationId
              ? { ...item, is_read: true }
              : item
          )
        );
      }
    } catch (err) {
      setActionError(
        err.response?.data?.detail ||
          "Impossible de marquer cette notification comme lue."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  if (patientsLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Consultez les alertes, les rappels et les événements liés au suivi médical."
      />

      {isDoctor && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="notification-patient"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Sélectionner un patient
          </label>

          <select
            id="notification-patient"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 sm:max-w-md"
          >
            {patients.length === 0 && (
              <option value="">Aucun patient disponible</option>
            )}

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Notifications affichées
            </span>
            <Bell className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Non lues
            </span>
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {unreadCount}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-brand-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Toutes
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filter === "unread"
                ? "bg-brand-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Non lues
          </button>
        </div>

        <Button variant="secondary" onClick={loadNotifications}>
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={loadNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          description={
            filter === "unread"
              ? "Vous n'avez aucune notification non lue."
              : "Aucune notification n'est disponible pour le moment."
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcon(notification.type);

            return (
              <article
                key={notification.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition ${
                  notification.is_read
                    ? "border-slate-200"
                    : "border-brand-200 bg-brand-50/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      notification.type?.includes("abnormal")
                        ? "bg-amber-100 text-amber-600"
                        : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-800">
                        {notification.title}
                      </h2>

                      {!notification.is_read && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                          Non lue
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {TYPE_LABELS[notification.type] || notification.type}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      disabled={updatingId === notification.id}
                      onClick={() => markAsRead(notification.id)}
                      title="Marquer comme lue"
                      aria-label="Marquer comme lue"
                      className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                    >
                      {updatingId === notification.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {notification.is_read && (
                    <CheckCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

