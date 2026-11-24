
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
  date_of_birth: "1990-05-15",
  sex: "M",
  disease: "TYPE_2_DIABETES",
  phone: "0612345678",
  address: "Casablanca",
  is_active: true,
};

const PATIENTS_RESPONSE = {
  items: [PATIENT],
  total: 1,
};

// Authentification et notifications
const stubAuth = () => {
  cy.intercept("GET", "**/api/v1/auth/me", {
    statusCode: 200,
    body: DOCTOR,
  }).as("authMe");

  cy.intercept("GET", "**/api/v1/notifications**", {
    statusCode: 200,
    body: {
      items: [],
      total: 0,
    },
  }).as("notifications");
};

// Ouvrir la page patients
const openPatients = (response = PATIENTS_RESPONSE) => {
  stubAuth();

  cy.intercept(
    {
      method: "GET",
      pathname: "/api/v1/patients",
    },
    {
      statusCode: 200,
      body: response,
    }
  ).as("patientsList");

  cy.visit("/patients", {
    onBeforeLoad(win) {
      win.sessionStorage.setItem("cc_token", "fake-test-token");
    },
  });

  cy.wait("@authMe");
  cy.wait("@patientsList");
};

describe("ChronicCare - Gestion des patients", () => {

  // TEST 1 : Afficher la liste
  it("affiche correctement la liste des patients", () => {
    openPatients();

    cy.contains("Patients").should("be.visible");
    cy.contains("Luc Durand").should("be.visible");
    cy.contains("luc@test.com").should("be.visible");
    cy.contains("Diabète T2").should("be.visible");

    cy.get("select").should("have.length.at.least", 2);
    cy.get("select").eq(0).should("have.value", "");
  });

  // TEST 2 : Liste vide
  it("affiche un message lorsqu'aucun patient n'existe", () => {
    openPatients({
      items: [],
      total: 0,
    });

    cy.contains("Aucun patient trouvé").should("be.visible");
  });

  // TEST 3 : Recherche par nom
  it("permet de rechercher un patient par son nom", () => {
    openPatients();

    cy.intercept(
      {
        method: "GET",
        pathname: "/api/v1/patients",
        query: { search: "Luc" },
      },
      {
        statusCode: 200,
        body: PATIENTS_RESPONSE,
      }
    ).as("searchPatient");

    cy.get('input[placeholder*="Rechercher"]')
      .should("be.visible")
      .type("Luc");

    cy.wait("@searchPatient")
      .its("request.url")
      .should("include", "search=Luc");
  });

  // TEST 4 : Filtrer les patients actifs
  it("permet de filtrer les patients actifs", () => {
    openPatients();

    cy.intercept(
      {
        method: "GET",
        pathname: "/api/v1/patients",
        query: { status: "active" },
      },
      {
        statusCode: 200,
        body: PATIENTS_RESPONSE,
      }
    ).as("filterActive");

    cy.get("select").eq(0).select("active");

    cy.wait("@filterActive")
      .its("request.url")
      .should("include", "status=active");
  });

  // TEST 5 : Filtrer par pathologie
  it("permet de filtrer les patients par pathologie", () => {
    openPatients();

    cy.intercept(
      {
        method: "GET",
        pathname: "/api/v1/patients",
        query: { disease: "TYPE_2_DIABETES" },
      },
      {
        statusCode: 200,
        body: PATIENTS_RESPONSE,
      }
    ).as("filterDisease");

    cy.get("select").eq(1).select("TYPE_2_DIABETES");

    cy.wait("@filterDisease")
      .its("request.url")
      .should("include", "disease=TYPE_2_DIABETES");
  });

  // TEST 6 : Navigation vers création
  it("permet d'accéder à la page de création d'un patient", () => {
    openPatients();

    cy.contains("button", "Nouveau patient")
      .should("be.visible")
      .click();

    cy.url().should("include", "/patients/nouveau");
  });

  // TEST 7 : Accès au dossier patient
  it("permet d'accéder au dossier d'un patient", () => {
    openPatients();

    // Informations du patient
    cy.intercept(
      "GET",
      "**/api/v1/patients/pat-1",
      {
        statusCode: 200,
        body: PATIENT,
      }
    ).as("getPatient");

    // Les traitements doivent être un tableau
    cy.intercept(
      "GET",
      "**/api/v1/patients/pat-1/treatments",
      {
        statusCode: 200,
        body: [],
      }
    ).as("getTreatments");

    cy.contains("Luc Durand")
      .should("be.visible")
      .click();

    cy.wait("@getPatient");
    cy.wait("@getTreatments");

    cy.url().should("include", "/patients/pat-1");
  });

  // TEST 8 : Accès à la modification
  it("permet d'accéder à la modification d'un patient", () => {
    openPatients();

    cy.intercept(
      "GET",
      "**/api/v1/patients/pat-1",
      {
        statusCode: 200,
        body: PATIENT,
      }
    ).as("getPatientForEdit");

    cy.get('a[href="/patients/pat-1/modifier"]')
      .should("exist")
      .click();

    cy.wait("@getPatientForEdit");

    cy.url().should("include", "/patients/pat-1/modifier");
  });

  // TEST 9 : Désactiver un patient
  it("permet de désactiver un patient", () => {
    openPatients();

    cy.intercept("PATCH", "**/api/v1/patients/pat-1", {
      statusCode: 200,
      body: {
        ...PATIENT,
        is_active: false,
      },
    }).as("deactivatePatient");

    cy.get('button[title="Désactiver"]')
      .should("be.visible")
      .click();

    cy.wait("@deactivatePatient").then(({ request }) => {
      expect(request.body).to.deep.equal({
        is_active: false,
      });
    });

    cy.contains("Dossier patient désactivé.")
      .should("be.visible");
  });

  // TEST 10 : Réactiver un patient
  it("permet de réactiver un patient", () => {
    openPatients({
      items: [
        {
          ...PATIENT,
          is_active: false,
        },
      ],
      total: 1,
    });

    cy.intercept("PATCH", "**/api/v1/patients/pat-1", {
      statusCode: 200,
      body: PATIENT,
    }).as("reactivatePatient");

    cy.get('button[title="Réactiver"]')
      .should("be.visible")
      .click();

    cy.wait("@reactivatePatient").then(({ request }) => {
      expect(request.body).to.deep.equal({
        is_active: true,
      });
    });

    cy.contains("Dossier patient réactivé.")
      .should("be.visible");
  });

  // TEST 11 : Supprimer un patient
  it("permet de supprimer un patient après confirmation", () => {
    openPatients();

    cy.intercept("DELETE", "**/api/v1/patients/pat-1", {
      statusCode: 204,
      body: "",
    }).as("deletePatient");

    cy.get('button[title="Supprimer"]')
      .should("be.visible")
      .click();

    cy.contains("Supprimer ce patient ?")
      .should("be.visible");

    cy.contains("button", "Supprimer définitivement")
      .click();

    cy.wait("@deletePatient");

    cy.contains("Dossier patient supprimé.")
      .should("be.visible");
  });

  // TEST 12 : Pagination
  it("permet de passer à la page suivante", () => {
    openPatients({
      items: [PATIENT],
      total: 25,
    });

    cy.intercept(
      {
        method: "GET",
        pathname: "/api/v1/patients",
        query: { offset: "20" },
      },
      {
        statusCode: 200,
        body: {
          items: [],
          total: 25,
        },
      }
    ).as("nextPage");

    cy.contains("button", "Suivant")
      .should("be.visible")
      .click();

    cy.wait("@nextPage")
      .its("request.url")
      .should("include", "offset=20");
  });

  // TEST 13 : Erreur serveur
  it("gère une erreur serveur lors du chargement des patients", () => {
    stubAuth();

    cy.intercept(
      {
        method: "GET",
        pathname: "/api/v1/patients",
      },
      {
        statusCode: 500,
        body: {
          detail: "Erreur serveur",
        },
      }
    ).as("patientsError");

    cy.visit("/patients", {
      onBeforeLoad(win) {
        win.sessionStorage.setItem("cc_token", "fake-test-token");
      },
    });

    cy.wait("@authMe");
    cy.wait("@patientsError");

    cy.contains("Patients").should("be.visible");
  });

});
