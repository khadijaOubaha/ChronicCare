// Fichier autonome : Mesures (Backend réel). Aucune modification de cypress.config.js nécessaire.
const AUTH = "/api/v1/auth";

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

describe("Mesures — Backend réel (port 8003)", () => {
  const run = Date.now();
  const patientAccount = {
    first_name: "Cypress",
    last_name: `Mesure${run}`,
    email: `cypress.mesure.${run}@example.com`,
    password: "Cypress#12345",
    disease: "HYPERTENSION",
  };
  let patient; // { token, id (compte), recordId (fiche Patients) }
  let url; // /api/v1/patients/{recordId}/mesures
  let tension; // type de mesure « tension artérielle »

  before(function () {
    cy.env(["DOCTOR_EMAIL", "DOCTOR_PASSWORD"]).then(
      ({ DOCTOR_EMAIL, DOCTOR_PASSWORD }) => {
        if (!DOCTOR_EMAIL || !DOCTOR_PASSWORD) {
          throw new Error(
            "Définissez CYPRESS_DOCTOR_EMAIL et CYPRESS_DOCTOR_PASSWORD (compte médecin/ADMIN existant)."
          );
        }
        loginApi(DOCTOR_EMAIL, DOCTOR_PASSWORD).then((doctor) => {
          api("POST", "/api/v1/patients", { token: doctor.token, body: patientAccount }).then(
            ({ status, body }) => {
              expect(status).to.eq(201);
              loginApi(patientAccount.email, patientAccount.password).then((p) => {
                patient = { ...p, recordId: body.id };
                url = `/api/v1/patients/${body.id}/mesures`;
              });
            }
          );
        });
      }
    );
  });

  // ---------- Sécurité ----------
  it("refuse l'accès sans jeton (jamais 200)", () => {
    // Le service Mesures relaie le jeton au service Patients : sans jeton, la réponse
    // est un refus (401/403, ou 502 si Patients répond 401 à Mesures).
    api("GET", `${url}/historique`)
      .its("status")
      .should("be.oneOf", [401, 403, 502]);
  });

  it("refuse un patient inexistant (404 ou 403)", () => {
    api("GET", "/api/v1/patients/00000000-0000-4000-a000-000000000000/mesures/types", {
      token: patient.token,
    })
      .its("status")
      .should("be.oneOf", [403, 404]);
  });

  // ---------- Profil et types ----------
  it("renvoie le profil du patient", () => {
    api("GET", `${url}/profil`, { token: patient.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.patient.id).to.eq(patient.recordId);
      expect(body.patient.disease_type).to.eq("hypertension");
      expect(body.type_principal_id).to.be.a("string");
    });
  });

  it("ne propose que les types liés à la maladie (tension artérielle)", () => {
    api("GET", `${url}/types`, { token: patient.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.be.an("array").and.not.be.empty;
      tension = body.find((t) => t.code === "tension_arterielle");
      expect(tension, "type tension_arterielle").to.exist;
      expect(tension.deux_valeurs).to.eq(true);
    });
  });

  it("l'état du jour est vide avant toute saisie", () => {
    api("GET", `${url}/aujourdhui`, { token: patient.token }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.enregistrees).to.eq(0);
      expect(body.aucune_enregistree).to.eq(true);
      expect(body.cartes.every((c) => c.statut === "a_renseigner")).to.eq(true);
    });
  });

  // ---------- Validation (rien n'est enregistré) ----------
  describe("validation des saisies", () => {
    it("refuse un type de mesure inconnu (404)", () => {
      api("POST", url, {
        token: patient.token,
        body: { type_mesure_id: "00000000-0000-4000-a000-000000000000", valeur: 120, valeur_secondaire: 80 },
      })
        .its("status")
        .should("eq", 404);
    });

    it("refuse une valeur hors bornes (422)", () => {
      api("POST", url, {
        token: patient.token,
        body: { type_mesure_id: tension.id, valeur: 1000, valeur_secondaire: 80 },
      })
        .its("status")
        .should("eq", 422);
    });

    it("exige la pression diastolique (422)", () => {
      api("POST", url, {
        token: patient.token,
        body: { type_mesure_id: tension.id, valeur: 120 },
      })
        .its("status")
        .should("eq", 422);
    });

    it("refuse systolique <= diastolique (422)", () => {
      api("POST", url, {
        token: patient.token,
        body: { type_mesure_id: tension.id, valeur: 80, valeur_secondaire: 90 },
      })
        .its("status")
        .should("eq", 422);
    });

    it("refuse les champs imposés par le serveur (422)", () => {
      api("POST", url, {
        token: patient.token,
        body: {
          type_mesure_id: tension.id,
          valeur: 120,
          valeur_secondaire: 80,
          date_mesure: "2020-01-01T00:00:00Z",
        },
      })
        .its("status")
        .should("eq", 422);
    });
  });

  // ---------- Enregistrement ----------
  describe("enregistrement d'une mesure", () => {
    it("enregistre une tension valide (201)", () => {
      api("POST", url, {
        token: patient.token,
        body: {
          type_mesure_id: tension.id,
          valeur: 125,
          valeur_secondaire: 82,
          commentaire: "  Cypress  ",
        },
      }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.patient_id).to.eq(patient.recordId);
        expect(body.valeur).to.eq(125);
        expect(body.valeur_secondaire).to.eq(82);
        expect(body.commentaire).to.eq("Cypress");
        expect(body.jour_mesure).to.match(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it("refuse une seconde mesure du même type le même jour (409)", () => {
      api("POST", url, {
        token: patient.token,
        body: { type_mesure_id: tension.id, valeur: 130, valeur_secondaire: 85 },
      })
        .its("status")
        .should("eq", 409);
    });

    it("l'état du jour reflète la mesure enregistrée", () => {
      api("GET", `${url}/aujourdhui`, { token: patient.token }).then(({ body }) => {
        expect(body.enregistrees).to.be.at.least(1);
        const carte = body.cartes.find((c) => c.type_mesure.id === tension.id);
        expect(carte.statut).to.eq("enregistree");
        expect(carte.mesure.valeur).to.eq(125);
      });
    });

    it("l'historique contient la mesure", () => {
      api("GET", `${url}/historique`, { token: patient.token }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.total).to.be.at.least(1);
        expect(body.items[0].type_mesure_id).to.eq(tension.id);
        expect(body.items[0].valeur).to.eq(125);
      });
    });

    it("l'historique accepte un filtre de type et une période", () => {
      api("GET", `${url}/historique`, {
        token: patient.token,
        qs: { type_mesure_id: tension.id, jours: 7 },
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        body.items.forEach((m) => expect(m.type_mesure_id).to.eq(tension.id));
      });
    });

    it("refuse « jours » combiné avec des dates (400)", () => {
      api("GET", `${url}/historique`, {
        token: patient.token,
        qs: { jours: 7, date_debut: "2026-01-01" },
      })
        .its("status")
        .should("eq", 400);
    });

    it("la courbe renvoie le point enregistré", () => {
      api("GET", `${url}/courbe`, { token: patient.token, qs: { jours: 7 } }).then(
        ({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.vide).to.eq(false);
          expect(body.points.length).to.be.at.least(1);
        }
      );
    });

    it("refuse jours hors limites sur la courbe (422)", () => {
      api("GET", `${url}/courbe`, { token: patient.token, qs: { jours: 1000 } })
        .its("status")
        .should("eq", 422);
    });
  });

  // ---------- Interface ----------
  it("UI : la page « Mes mesures » s'affiche pour le patient", () => {
    visitAs(patient.token, "/mesures");
    cy.contains("Mes mesures").should("be.visible");
    cy.contains("Saisir une mesure").should("be.visible");
    cy.contains("Historique").should("be.visible");
  });

  it("UI : sans session, /mesures redirige vers /login", () => {
    cy.visit("/mesures");
    cy.location("pathname").should("eq", "/login");
  });
});
