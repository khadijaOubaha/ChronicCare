// Fichier autonome : aucune modification de cypress.config.js ni de support/ n'est nécessaire.
const AUTH = "/api/v1/auth";
const TELE = "/api/v1/teleconsultations";

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

// Date future unique (évite les conflits de créneau entre exécutions).
function futureIso(daysAhead = 30) {
  const d = new Date(
    Date.now() + daysAhead * 86400000 + Math.floor(Math.random() * 100000) * 60000
  );
  d.setSeconds(0, 0);
  return d.toISOString();
}

describe("Téléconsultations — Backend réel (port 8005)", () => {
  const run = Date.now();
  const patientAccount = {
    first_name: "Cypress",
    last_name: `Tele${run}`,
    email: `cypress.tele.${run}@example.com`,
    password: "Cypress#12345",
    disease: "HYPERTENSION",
  };
  let doctor; // { token, id }
  let patient; // { token, id }

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
          expect(d.role).to.eq("ADMIN");
          // Le médecin crée un patient jetable (compte Auth + dossier Patients).
          api("POST", "/api/v1/patients", { token: d.token, body: patientAccount })
            .its("status")
            .should("eq", 201);
          loginApi(patientAccount.email, patientAccount.password).then((p) => {
            patient = p;
            expect(p.role).to.eq("PATIENT");
          });
        });
      }
    );
  });

  // ---------- Sécurité ----------
  it("refuse l'accès sans jeton (401)", () => {
    api("GET", TELE).its("status").should("eq", 401);
  });

  it("interdit au patient de créer une consultation directement (403)", () => {
    api("POST", TELE, {
      token: patient.token,
      body: { patient_id: patient.id, doctor_id: doctor.id, scheduled_at: futureIso() },
    })
      .its("status")
      .should("eq", 403);
  });

  // ---------- Médecins ----------
  it("liste les médecins actifs", () => {
    api("GET", `${TELE}/doctors`, { token: patient.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.map((d) => d.id)).to.include(doctor.id);
    });
  });

  // ---------- Parcours : demande -> confirmation -> terminée ----------
  describe("cycle de vie d'une demande", () => {
    let item;
    const slot = futureIso(40);

    it("le patient envoie une demande (REQUESTED)", () => {
      api("POST", `${TELE}/requests`, {
        token: patient.token,
        body: { doctor_id: doctor.id, notes: "Contrôle tension (Cypress)" },
      }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.status).to.eq("REQUESTED");
        expect(body.doctor_id).to.eq(doctor.id);
        expect(body.scheduled_at).to.eq(null);
        item = body;
      });
    });

    it("le patient retrouve sa demande, pas celles des autres", () => {
      api("GET", TELE, { token: patient.token }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.items.map((t) => t.id)).to.include(item.id);
        body.items.forEach((t) => expect(t.patient_id).to.eq(item.patient_id));
      });
    });

    it("le patient ne peut pas confirmer (403)", () => {
      api("PATCH", `${TELE}/${item.id}/confirm`, {
        token: patient.token,
        body: { scheduled_at: slot },
      })
        .its("status")
        .should("eq", 403);
    });

    it("refuse une confirmation dans le passé (400)", () => {
      api("PATCH", `${TELE}/${item.id}/confirm`, {
        token: doctor.token,
        body: { scheduled_at: "2020-01-01T10:00:00Z" },
      })
        .its("status")
        .should("eq", 400);
    });

    it("refuse de passer une demande en SCHEDULED via /status (409)", () => {
      api("PATCH", `${TELE}/${item.id}/status`, {
        token: doctor.token,
        body: { status: "SCHEDULED" },
      })
        .its("status")
        .should("eq", 409);
    });

    it("le médecin confirme la demande (SCHEDULED)", () => {
      api("PATCH", `${TELE}/${item.id}/confirm`, {
        token: doctor.token,
        body: { scheduled_at: slot, meeting_link: "https://meet.jit.si/cypress-test" },
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.status).to.eq("SCHEDULED");
        expect(body.meeting_link).to.eq("https://meet.jit.si/cypress-test");
      });
    });

    it("refuse un second rendez-vous au même créneau (409)", () => {
      api("POST", `${TELE}/requests`, {
        token: patient.token,
        body: { doctor_id: doctor.id, notes: "Doublon (Cypress)" },
      }).then(({ body }) => {
        api("PATCH", `${TELE}/${body.id}/confirm`, {
          token: doctor.token,
          body: { scheduled_at: slot },
        })
          .its("status")
          .should("eq", 409);
        api("PATCH", `${TELE}/${body.id}/status`, {
          token: doctor.token,
          body: { status: "CANCELLED" },
        });
      });
    });

    it("le médecin termine la consultation (COMPLETED)", () => {
      api("PATCH", `${TELE}/${item.id}/status`, {
        token: doctor.token,
        body: { status: "COMPLETED" },
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.status).to.eq("COMPLETED");
      });
    });

    it("refuse une transition depuis un état final (409)", () => {
      api("PATCH", `${TELE}/${item.id}/status`, {
        token: doctor.token,
        body: { status: "CANCELLED" },
      })
        .its("status")
        .should("eq", 409);
    });

    it("seules les notes d'une consultation terminée sont modifiables", () => {
      api("PUT", `${TELE}/${item.id}`, {
        token: doctor.token,
        body: { scheduled_at: futureIso(50) },
      })
        .its("status")
        .should("eq", 409);
      api("PUT", `${TELE}/${item.id}`, {
        token: doctor.token,
        body: { notes: "Compte rendu (Cypress)" },
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.notes).to.eq("Compte rendu (Cypress)");
      });
    });

    it("le médecin supprime la consultation (204) puis 404", () => {
      api("DELETE", `${TELE}/${item.id}`, { token: doctor.token })
        .its("status")
        .should("eq", 204);
      api("GET", `${TELE}/${item.id}`, { token: doctor.token })
        .its("status")
        .should("eq", 404);
    });
  });

  // ---------- Validation ----------
  it("rejette une demande avec un médecin inconnu (404)", () => {
    api("POST", `${TELE}/requests`, {
      token: patient.token,
      body: { doctor_id: "00000000-0000-4000-a000-000000000000", notes: "x" },
    })
      .its("status")
      .should("eq", 404);
  });

  it("rejette un doctor_id invalide (422)", () => {
    api("POST", `${TELE}/requests`, {
      token: patient.token,
      body: { doctor_id: "pas-un-uuid" },
    })
      .its("status")
      .should("eq", 422);
  });

  // ---------- Interface ----------
  it("UI : le patient envoie une demande depuis la page de rendez-vous", () => {
    const motif = `Motif UI Cypress ${run}`;
    cy.intercept("POST", `${TELE}/requests`).as("request");
    cy.intercept("GET", `${TELE}/doctors`).as("doctors");

    visitAs(patient.token, "/teleconsultations/nouveau");
    cy.wait("@doctors").its("response.statusCode").should("eq", 200);

    cy.contains("Prendre un rendez-vous").should("be.visible");
    cy.get("textarea").type(motif);
    cy.contains("button", "Envoyer ma demande").click();

    cy.wait("@request").its("response.statusCode").should("eq", 201);
    cy.contains("Demande envoyée").should("be.visible");
    cy.location("pathname", { timeout: 6000 }).should("eq", "/teleconsultations");

    // La demande existe bien côté Backend avec le statut REQUESTED.
    api("GET", TELE, { token: patient.token, qs: { status: "REQUESTED" } }).then(
      ({ body }) => {
        const found = body.items.find((t) => t.notes === motif);
        expect(found, "demande créée via l'UI").to.exist;
        api("PATCH", `${TELE}/${found.id}/status`, {
          token: doctor.token,
          body: { status: "CANCELLED" },
        });
      }
    );
  });

  it("UI : la page patient redirige vers /login sans session", () => {
    cy.visit("/teleconsultations");
    cy.location("pathname").should("eq", "/login");
  });
});