
const DOCTOR = {
  id: "doc-1",
  full_name: "Sara Bennani",
  email: "sara@test.com",
  role: "ADMIN",
  is_active: true,
};

const PATIENT = {
  id: "pat-1",
  first_name: "Luc",
  last_name: "Durand",
  email: "luc@test.com",
  disease: "TYPE_2_DIABETES",
  is_active: true,
};

const stubAuth = () => {
  cy.intercept("GET", "**/api/v1/auth/me", {
    statusCode: 200,
    body: DOCTOR,
  }).as("authMe");

  cy.intercept("GET", "**/api/v1/notifications**", {
    statusCode: 200,
    body: { items: [], total: 0 },
  }).as("notifications");
};

const openAddTreatment = (url = "/prescriptions/nouveau") => {
  stubAuth();

  cy.intercept("GET", "**/api/v1/patients*", {
    statusCode: 200,
    body: { items: [PATIENT], total: 1 },
  }).as("patientsList");

  cy.visit(url, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem("cc_token", "fake-test-token");
    },
  });

  cy.wait("@authMe");
  cy.wait("@patientsList");
};

describe("Ajout d'une prescription", () => {
  beforeEach(() => {
    openAddTreatment();
  });

  it("affiche le formulaire", () => {
    cy.contains("Nouvelle prescription").should("be.visible");
    cy.contains("Patient").should("be.visible");
    cy.contains("Nom du médicament").should("be.visible");
    cy.contains("Dosage").should("be.visible");
    cy.contains("Fréquence").should("be.visible");
    cy.contains("Enregistrer la prescription").should("be.visible");
  });

  it("charge la liste des patients", () => {
    cy.get("select")
      .first()
      .find('option[value="pat-1"]')
      .should("exist")
      .and("contain", "Luc Durand");
  });

  it("préselectionne le patient depuis l'URL", () => {
    openAddTreatment("/prescriptions/nouveau?patient=pat-1");

    cy.get("select").first().should("have.value", "pat-1");
  });

  it("vérifie les champs obligatoires", () => {
    cy.get("form").submit();

    cy.contains("Veuillez sélectionner un patient.")
      .should("be.visible");

    cy.contains("Le nom du médicament est obligatoire.")
      .should("be.visible");

    cy.contains("Le dosage est obligatoire.")
      .should("be.visible");

    cy.contains("La fréquence de prise est obligatoire.")
      .should("be.visible");
  });

  it("met à jour la pathologie lors du changement de patient", () => {
    cy.get("select").first().select("pat-1");

    cy.get("select")
      .eq(1)
      .should("have.value", "TYPE_2_DIABETES");
  });

  it("refuse une date de fin antérieure à la date de début", () => {
    cy.get('input[type="date"]')
      .first()
      .clear()
      .type("2026-10-20");

    cy.get('input[type="date"]')
      .eq(1)
      .clear()
      .type("2026-10-10");

    cy.get("form").submit();

    cy.contains(
      "La date de fin doit être postérieure à la date de début."
    ).should("be.visible");
  });

  it("crée une prescription et redirige vers ses détails", () => {
    cy.intercept("POST", "**/api/v1/treatments", {
      statusCode: 201,
      body: { id: "treatment-1" },
    }).as("createTreatment");

    cy.get("select").first().select("pat-1");

    cy.contains("label", "Nom du médicament")
      .parent()
      .parent()
      .find("input")
      .type("Metformine");

    cy.contains("label", "Dosage")
      .parent()
      .parent()
      .find("input")
      .type("500 mg");

    cy.contains("label", "Fréquence")
      .parent()
      .parent()
      .find("input")
      .type("2 fois par jour");

    cy.get("form").submit();

    cy.wait("@createTreatment").then(({ request }) => {
      expect(request.body).to.include({
        patient_id: "pat-1",
        medication_name: "Metformine",
        dosage: "500 mg",
        frequency: "2 fois par jour",
      });
    });

    cy.url().should("include", "/prescriptions/treatment-1");
  });

  it("affiche une erreur si le serveur refuse la création", () => {
    cy.intercept("POST", "**/api/v1/treatments", {
      statusCode: 500,
      body: { detail: "Erreur serveur" },
    }).as("createTreatmentError");

    cy.get("select").first().select("pat-1");

    cy.contains("label", "Nom du médicament")
      .parent()
      .parent()
      .find("input")
      .type("Metformine");

    cy.contains("label", "Dosage")
      .parent()
      .parent()
      .find("input")
      .type("500 mg");

    cy.contains("label", "Fréquence")
      .parent()
      .parent()
      .find("input")
      .type("2 fois par jour");

    cy.get("form").submit();

    cy.wait("@createTreatmentError");

    cy.contains("Erreur serveur").should("be.visible");
  });

  it("permet de revenir à la liste des prescriptions", () => {
    cy.get('a[title="Retour aux prescriptions"]')
      .should("have.attr", "href", "/prescriptions");
  });

  it("affiche le lien d'annulation", () => {
    cy.contains("Annuler").should("be.visible");
    cy.get('a[href="/prescriptions"]')
      .should("exist");
  });
});
