# Vérification des en-têtes de sécurité – ChronicCare

**Outil :** OWASP ZAP 2.17.0  
**Date :** 24/11/2026  
**URL testée :** http://localhost:3000

## 1. Objectif

Vérifier la présence des principaux en-têtes de sécurité HTTP après leur configuration dans le serveur Vite.

## 2. Résultats

| En-tête HTTP | Configuration | Résultat |
|---|---|---|
| Content-Security-Policy | Configuré | Présent |
| X-Frame-Options | DENY | Présent |
| X-Content-Type-Options | nosniff | Présent |

## 3. Vérification

La réponse HTTP `200 OK` de la page d'accueil contient les trois en-têtes attendus.

La page fonctionne correctement après l'ajustement de la directive `script-src` pour le serveur de développement Vite.

## 4. Vérification après correction avec OWASP ZAP

Une deuxième session d'analyse passive a été réalisée après les modifications.

Le nombre de catégories d'alertes est passé de 18 à 13.

Les deux alertes suivantes ne sont plus détectées :

- Content Security Policy (CSP) Header Not Set.
- Missing Anti-clickjacking Header.

L'alerte X-Content-Type-Options Header Missing reste toutefois présente sur certaines réponses API et une ressource externe, malgré la présence de cet en-tête dans la réponse de la page d'accueil.

## 5. Remarque et perspectives

Les corrections réalisées ont amélioré la configuration des en-têtes HTTP de sécurité de l'application.

Certaines alertes restent à examiner, notamment les directives CSP, la configuration inter-domaines et les réponses des microservices.

La politique CSP devra être renforcée et adaptée avant le déploiement en production.