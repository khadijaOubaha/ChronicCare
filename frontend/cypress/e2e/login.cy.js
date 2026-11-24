// Tests de la page de connexion : src/pages/LoginPage.jsx
// Tous les appels API sont simulés avec cy.intercept (aucun backend requis).

const DOCTOR = {
  id: 'doc-1',
  full_name: 'Sara Bennani',
  email: 'sara@test.com',
  role: 'ADMIN', // ADMIN = médecin (voir src/auth/roles.js)
  is_active: true,
};

const PATIENT = {
  id: 'pat-1',
  full_name: 'Luc Durand',
  email: 'luc@test.com',
  role: 'PATIENT',
  is_active: true,
};

// Réponses réussies de l'API Auth
const stubLogin = () =>
  cy
    .intercept('POST', '**/api/v1/auth/login', {
      access_token: 'fake-test-token',
      token_type: 'bearer',
    })
    .as('loginRequest');

const stubMe = (user) =>
  cy.intercept('GET', '**/api/v1/auth/me', user).as('meRequest');

// Appels faits par le layout et les tableaux de bord après connexion
const stubDashboards = () => {
  cy.intercept('GET', '**/api/v1/notifications*', { items: [], total: 0 });
  cy.intercept('GET', '**/api/v1/patients*', { items: [], total: 0 });
  cy.intercept('GET', '**/api/v1/treatments/me', []);
};

const fillAndSubmit = (email, password) => {
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.contains('Se connecter').click();
};

describe('ChronicCare - Page de connexion', () => {
  // TEST 1 : Vérifier l'affichage du formulaire
  it('affiche correctement le formulaire de connexion', () => {
    cy.visit('/login');

    cy.contains('Bon retour parmi nous').should('be.visible');

    cy.contains(
      'Veuillez saisir vos identifiants pour accéder à votre compte.'
    ).should('be.visible');

    cy.contains('Adresse e-mail').should('be.visible');
    cy.contains('Mot de passe').should('be.visible');
    cy.contains('Se connecter').should('be.visible');

    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');

    cy.contains('[role="tab"]', 'Patient').should('be.visible');
    cy.contains('[role="tab"]', 'Médecin').should('be.visible');
  });

  // TEST 2 : L'onglet Patient est sélectionné par défaut, et on peut changer
  it("sélectionne l'onglet Patient par défaut et permet de passer à Médecin", () => {
    cy.visit('/login');

    cy.contains('[role="tab"]', 'Patient').should('have.attr', 'aria-selected', 'true');
    cy.contains('[role="tab"]', 'Médecin').should('have.attr', 'aria-selected', 'false');

    cy.contains('[role="tab"]', 'Médecin').click();

    cy.contains('[role="tab"]', 'Médecin').should('have.attr', 'aria-selected', 'true');
    cy.contains('[role="tab"]', 'Patient').should('have.attr', 'aria-selected', 'false');
  });

  // TEST 3 : Champs obligatoires
  it('affiche les erreurs si les champs sont vides', () => {
    cy.visit('/login');

    cy.contains('Se connecter').click();

    cy.contains("L'adresse e-mail est obligatoire.").should('be.visible');
    cy.contains('Le mot de passe est obligatoire.').should('be.visible');
  });

  // TEST 4 : Format de l'e-mail
  it("affiche une erreur si l'adresse e-mail est invalide", () => {
    cy.visit('/login');

    fillAndSubmit('pas-un-email', 'MotDePasseTest123!');

    cy.contains('Saisissez une adresse e-mail valide.').should('be.visible');
  });

  // TEST 5 : Identifiants incorrects
  it('affiche une erreur avec des identifiants incorrects', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: { detail: 'Identifiants incorrects.' },
    }).as('loginRequest');

    cy.visit('/login');
    cy.contains('[role="tab"]', 'Médecin').click();

    fillAndSubmit('medecin@test.com', 'MotDePasseIncorrect123!');

    cy.wait('@loginRequest');

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain', 'Identifiants incorrects.');

    cy.url().should('include', '/login');
  });

  // TEST 6 : Compte désactivé
  it('affiche une erreur si le compte est désactivé (403)', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 403,
      body: { detail: 'Compte désactivé.' },
    }).as('loginRequest');

    cy.visit('/login');

    fillAndSubmit('luc@test.com', 'MotDePasseTest123!');

    cy.wait('@loginRequest');
    cy.get('[role="alert"]').should('contain', 'Compte désactivé.');
    cy.url().should('include', '/login');
  });

  // TEST 7 : Serveur injoignable
  it("affiche un message si le serveur est injoignable", () => {
    cy.intercept('POST', '**/api/v1/auth/login', { forceNetworkError: true }).as(
      'loginRequest'
    );

    cy.visit('/login');

    fillAndSubmit('luc@test.com', 'MotDePasseTest123!');

    cy.wait('@loginRequest');
    cy.get('[role="alert"]').should(
      'contain',
      'Impossible de joindre le serveur. Vérifiez votre connexion.'
    );
  });

  // TEST 8 : Rôle du compte différent de l'onglet choisi
  it('affiche une erreur si le rôle du compte ne correspond pas au rôle sélectionné', () => {
    stubLogin();
    stubMe(PATIENT);

    cy.visit('/login');
    cy.contains('[role="tab"]', 'Médecin').click();

    fillAndSubmit('patient@test.com', 'MotDePasseTest123!');

    cy.wait('@loginRequest');
    cy.wait('@meRequest');

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain', "Ce compte n'est pas un compte médecin.")
      .and('contain', "Choisissez l'onglet « Patient »");

    cy.url().should('include', '/login');

    // Le jeton ne doit pas rester stocké après un refus
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('cc_token')).to.be.null;
      expect(win.localStorage.getItem('cc_token')).to.be.null;
    });
  });

  // TEST 9 : Connexion réussie d'un médecin
  it('connecte un médecin et redirige vers le tableau de bord', () => {
    stubLogin();
    stubMe(DOCTOR);
    stubDashboards();

    cy.visit('/login');
    cy.contains('[role="tab"]', 'Médecin').click();

    fillAndSubmit('sara@test.com', 'MotDePasseTest123!');

    cy.wait('@loginRequest');
    cy.wait('@meRequest');

    cy.location('pathname').should('eq', '/');
    cy.contains('Bonjour, Dr. Sara Bennani').should('be.visible');
  });

  // TEST 10 : Connexion réussie d'un patient
  it('connecte un patient et redirige vers le tableau de bord', () => {
    stubLogin();
    stubMe(PATIENT);
    stubDashboards();

    cy.visit('/login');

    fillAndSubmit('luc@test.com', 'MotDePasseTest123!');

    cy.wait('@loginRequest');
    cy.wait('@meRequest');

    cy.location('pathname').should('eq', '/');
    cy.contains('Bonjour, Luc Durand').should('be.visible');
  });

  // TEST 11 : Stockage du jeton selon « Se souvenir de moi »
  it('stocke le jeton dans sessionStorage par défaut', () => {
    stubLogin();
    stubMe(PATIENT);
    stubDashboards();

    cy.visit('/login');
    fillAndSubmit('luc@test.com', 'MotDePasseTest123!');

    cy.location('pathname').should('eq', '/');
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('cc_token')).to.eq('fake-test-token');
      expect(win.localStorage.getItem('cc_token')).to.be.null;
    });
  });

  it('« Se souvenir de moi » stocke le jeton dans localStorage', () => {
    stubLogin();
    stubMe(PATIENT);
    stubDashboards();

    cy.visit('/login');

    cy.get('input[type="email"]').type('luc@test.com');
    cy.get('input[type="password"]').type('MotDePasseTest123!');
    cy.contains('Se souvenir de moi').click();
    cy.contains('Se connecter').click();

    cy.location('pathname').should('eq', '/');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('cc_token')).to.eq('fake-test-token');
      expect(win.sessionStorage.getItem('cc_token')).to.be.null;
    });
  });

  // TEST 12 : Liens et redirections
  it('le lien « Mot de passe oublié ? » mène à /forgot-password', () => {
    cy.visit('/login');

    cy.contains('a', 'Mot de passe oublié ?').click();

    cy.location('pathname').should('eq', '/forgot-password');
  });

  it('redirige vers /login quand on ouvre une page protégée sans être connecté', () => {
    cy.visit('/patients');

    cy.location('pathname').should('eq', '/login');
  });

  it('redirige vers « / » un utilisateur déjà connecté qui ouvre /login', () => {
    stubMe(PATIENT);
    stubDashboards();

    cy.visit('/login', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('cc_token', 'fake-test-token');
      },
    });

    cy.location('pathname').should('eq', '/');
  });

  // TEST 13 : Déconnexion
  it("déconnecte l'utilisateur et supprime le jeton", () => {
    stubMe(DOCTOR);
    stubDashboards();

    cy.visit('/', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('cc_token', 'fake-test-token');
      },
    });

    cy.contains('Bonjour, Dr. Sara Bennani').should('be.visible');

    cy.get('button[aria-label="Se déconnecter"]:visible').first().click();

    cy.location('pathname').should('eq', '/login');
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('cc_token')).to.be.null;
    });
  });
});
