// Fichier autonome : Notifications / Reminders (Backend réel).
const AUTH = "/api/v1/auth";
const NOTIF = "/api/v1/notifications";
const EVENTS = "/api/v1/events";

const api = (method, url, { token, body, qs } = {}) =>
  cy.request({
    method,
    url,
    body,
    qs,
    failOnStatusCode: false,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const loginApi = (email, password) =>
  cy
    .request({ method: "POST", url: `${AUTH}/login`, body: { email, password } })
    .then(({ body }) => {
      const token = body.access_token;
      return cy
        .request({ url: `${AUTH}/me`, headers: { Authorization: `Bearer ${token}` } })
        .then((me) => ({ token, id: me.body.id, role: me.body.role }));
    });

const visitAs = (token, path) =>
  cy.visit(path, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem("cc_token", token);
    },
  });

describe("Notifications — Backend réel (port 8004)", () => {
  const run = Date.now();
  const mkAccount = (tag) => ({
    first_name: "Cypress",
    last_name: `${tag}${run}`,
    email: `cypress.${tag.toLowerCase()}.${run}@example.com`,
    password: "Cypress#12345",
    disease: "HYPERTENSION",
  });
  const accountA = mkAccount("NotifA");
  const accountB = mkAccount("NotifB");

  let doctor; // { token, id }
  let patientA; // { token, recordId }
  let patientB; // { token, recordId }
  let eventResult; // { event_id, notification_id }

  const createPatient = (account) =>
    api("POST", "/api/v1/patients", { token: doctor.token, body: account }).then(
      ({ status, body }) => {
        expect(status).to.eq(201);
        return loginApi(account.email, account.password).then((p) => ({
          ...p,
          recordId: body.id,
        }));
      }
    );

  before(function () {
    cy.env(["DOCTOR_EMAIL", "DOCTOR_PASSWORD"]).then(
      ({ DOCTOR_EMAIL, DOCTOR_PASSWORD }) => {
        if (!DOCTOR_EMAIL || !DOCTOR_PASSWORD) {
          throw new Error(
            "Définissez CYPRESS_DOCTOR_EMAIL et CYPRESS_DOCTOR_PASSWORD (compte médecin/ADMIN existant)."
          );
        }
        loginApi(DOCTOR_EMAIL, DOCTOR_PASSWORD).then((d) => {
          doctor = d;
          createPatient(accountA).then((p) => {
            patientA = p;
          });
          createPatient(accountB).then((p) => {
            patientB = p;
          });
        });
      }
    );
  });

  // ---------- Sécurité ----------
  it("refuse l'accès sans jeton (401)", () => {
    api("GET", NOTIF).its("status").should("eq", 401);
  });

  it("le médecin sans filtre liste ses propres notifications (200)", () => {
    api("GET", NOTIF, { token: doctor.token }).its("status").should("eq", 200);
  });

  it("une liste vide pour un patient sans événement", () => {
    api("GET", NOTIF, { token: patientA.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.items).to.have.length(0);
      expect(body.total).to.eq(0);
    });
  });

  // ---------- Événements -> notifications ----------
  describe("création par événement", () => {
    it("rejette un type d'événement inconnu (422)", () => {
      api("POST", EVENTS, {
        token: doctor.token,
        body: { event_type: "inconnu.type", patient_id: patientA.recordId, doctor_id: doctor.id },
      })
        .its("status")
        .should("eq", 422);
    });

    it("rejette un patient_id invalide (422)", () => {
      api("POST", EVENTS, {
        token: doctor.token,
        body: { event_type: "teleconsultation.scheduled", patient_id: "pas-un-uuid" },
      })
        .its("status")
        .should("eq", 422);
    });

    it("accepte teleconsultation.scheduled et crée une notification (201)", () => {
      api("POST", EVENTS, {
        token: doctor.token,
        body: {
          event_type: "teleconsultation.scheduled",
          patient_id: patientA.recordId,
          doctor_id: doctor.id,
          data: { note: "cypress" },
        },
      }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.status).to.eq("processed");
        expect(body.notification_id).to.be.a("string");
        eventResult = body;
      });
    });

    it("accepte measurement.abnormal (201)", () => {
      api("POST", EVENTS, {
        token: doctor.token,
        body: {
          event_type: "measurement.abnormal",
          patient_id: patientA.recordId,
          doctor_id: doctor.id,
          data: { anomalies: [{ rule_code: "systolic_high" }] },
        },
      })
        .its("status")
        .should("eq", 201);
    });
  });

  // ---------- Lecture par le patient ----------
  describe("côté patient", () => {
    it("liste ses notifications, non lues", () => {
      api("GET", NOTIF, { token: patientA.token }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.total).to.be.at.least(2);
        const n = body.items.find((i) => i.id === eventResult.notification_id);
        expect(n, "notification créée").to.exist;
        expect(n.title).to.eq("Téléconsultation planifiée");
        expect(n.is_read).to.eq(false);
        expect(n.patient_id).to.eq(patientA.recordId);
      });
    });

    it("pagine avec limit et offset", () => {
      api("GET", NOTIF, { token: patientA.token, qs: { limit: 1, offset: 0 } }).then(
        ({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.items).to.have.length(1);
          expect(body.limit).to.eq(1);
        }
      );
    });

    it("refuse un limit hors bornes (422)", () => {
      api("GET", NOTIF, { token: patientA.token, qs: { limit: 1000 } })
        .its("status")
        .should("eq", 422);
    });

    it("renvoie le détail avec l'événement source", () => {
      api("GET", `${NOTIF}/${eventResult.notification_id}`, { token: patientA.token }).then(
        ({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.event_details.event_type).to.eq("teleconsultation.scheduled");
          expect(body.event_details.data.note).to.eq("cypress");
        }
      );
    });

    it("404 pour une notification inconnue", () => {
      api("GET", `${NOTIF}/00000000-0000-4000-a000-000000000000`, { token: patientA.token })
        .its("status")
        .should("eq", 404);
    });
  });

  // ---------- Isolation entre patients ----------
  describe("isolation", () => {
    it("un autre patient ne voit pas ces notifications", () => {
      api("GET", NOTIF, { token: patientB.token }).then(({ body }) => {
        expect(body.items.map((i) => i.id)).to.not.include(eventResult.notification_id);
      });
    });

    it("un autre patient ne peut pas lire le détail (403)", () => {
      api("GET", `${NOTIF}/${eventResult.notification_id}`, { token: patientB.token })
        .its("status")
        .should("eq", 403);
    });

    it("un autre patient ne peut pas la marquer comme lue (403)", () => {
      api("PATCH", `${NOTIF}/${eventResult.notification_id}/read`, { token: patientB.token })
        .its("status")
        .should("eq", 403);
    });

    it("un patient ne peut pas filtrer sur le dossier d'un autre (403)", () => {
      api("GET", NOTIF, { token: patientB.token, qs: { patient_id: patientA.recordId } })
        .its("status")
        .should("eq", 403);
    });
  });

  // ---------- Marquage comme lue ----------
  describe("marquage comme lue", () => {
    it("le patient marque la notification comme lue", () => {
      api("PATCH", `${NOTIF}/${eventResult.notification_id}/read`, {
        token: patientA.token,
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.is_read).to.eq(true);
        expect(body.read_at).to.be.a("string");
      });
    });

    it("elle disparaît du filtre unread_only", () => {
      api("GET", NOTIF, { token: patientA.token, qs: { unread_only: true } }).then(
        ({ body }) => {
          expect(body.items.map((i) => i.id)).to.not.include(eventResult.notification_id);
          body.items.forEach((i) => expect(i.is_read).to.eq(false));
        }
      );
    });

    it("l'opération est idempotente (200)", () => {
      api("PATCH", `${NOTIF}/${eventResult.notification_id}/read`, {
        token: patientA.token,
      })
        .its("status")
        .should("eq", 200);
    });
  });

  // ---------- Côté médecin ----------
  describe("côté médecin", () => {
    it("liste les notifications d'un patient précis", () => {
      api("GET", NOTIF, { token: doctor.token, qs: { patient_id: patientA.recordId } }).then(
        ({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.items.length).to.be.at.least(2);
          body.items.forEach((i) => expect(i.patient_id).to.eq(patientA.recordId));
        }
      );
    });

    it("ne voit rien pour un patient sans événement", () => {
      api("GET", NOTIF, { token: doctor.token, qs: { patient_id: patientB.recordId } }).then(
        ({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.items).to.have.length(0);
        }
      );
    });
  });

  // ---------- Interface ----------
  it("UI : le patient voit sa notification", () => {
    visitAs(patientA.token, "/notifications");
    cy.contains("Notifications").should("be.visible");
    cy.contains("Téléconsultation planifiée").should("be.visible");
    cy.contains("Mesure à vérifier").should("be.visible");
  });

  it("UI : sans session, /notifications redirige vers /login", () => {
    cy.visit("/notifications");
    cy.location("pathname").should("eq", "/login");
  });
});
