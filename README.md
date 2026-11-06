# Smart Campus by ABO WILLIAM JUNIOR

**Plateforme web de gestion de la vie académique** : emploi du temps, notes, absences, annonces, réservation de ressources, notifications, statistiques et bulletins PDF, dans une seule application dont l'interface et les droits s'adaptent au rôle de chaque utilisateur (étudiant, enseignant, administrateur).

Projet de Personel **Développeur Web Fullstack**, conçu, développé, testé et déployé.

**Démo en ligne** | https://smart-campus-nu-gilt.vercel.app/ |
**API (état de santé)** | https://smart-campus-api-awjo.onrender.com/api/health |
**Code source** | https://github.com/WILLIAM04052005/smart-campus |

>**Premier chargement** : l'API est hébergée sur une offre gratuite qui se met en veille après 15 minutes d'inactivité.

**Stack** : React · TypeScript · Vite · Tailwind CSS · Node.js · Express · PostgreSQL · Prisma · JWT · Jest · Render · Vercel · Neon

## Aperçu
![Tableau de bord administrateur](docs/screenshots/administrateurpage.png)
![Espace étudiant](docs/screenshots/studentpage.png)
---

## Sommaire

1. [Contexte et problématique](#1-contexte-et-problématique)
2. [Utilisateurs cibles (personas)](#2-utilisateurs-cibles-personas)
3. [Périmètre fonctionnel](#3-périmètre-fonctionnel)
4. [Architecture technique](#4-architecture-technique)
5. [Modèle de données](#5-modèle-de-données)
6. [Sécurité](#6-sécurité)
7. [Installation et lancement en local](#7-installation-et-lancement-en-local)
8. [Tests automatisés](#8-tests-automatisés)
9. [Déploiement](#9-déploiement)
10. [Documentation du projet](#10-documentation-du-projet)
11. [Limites connues et perspectives](#11-limites-connues-et-perspectives)
12. [Conclusion](#12-conclusion)
---

## 1. Contexte et problématique

Dans de nombreux établissements de formation de taille moyenne, la vie académique repose sur des outils dispersés : tableurs pour les emplois du temps, e-mails pour les annonces, registres papier pour les absences, feuilles de notes distribuées enseignant par enseignant. Ces outils ne communiquent pas entre eux, ce qui multiplie les erreurs et fait perdre du temps à tous.

Le projet se place dans un contexte fictif mais réaliste : **NextCampus**, un centre de formation informatique d'environ 350 étudiants répartis sur 5 filières. Un établissement de cette taille est trop grand pour se passer d'outil, mais trop petit pour justifier une solution du commerce, souvent coûteuse et surdimensionnée.

**Problématique** : comment centraliser la gestion de la vie académique (emploi du temps, notes, absences, communication, réservation de ressources) dans une plateforme unique, tout en adaptant l'information et les actions disponibles au rôle de chaque utilisateur ?

---

## 2. Utilisateurs cibles (personas)

| Rôle | Besoins principaux |

| **Étudiant** | Consulter son emploi du temps, ses notes et ses absences ; recevoir des notifications et des annonces ; réserver une salle ou du matériel ; télécharger son bulletin en PDF |
| **Enseignant** | Saisir les notes et les absences des matières qu'il enseigne ; publier des annonces |
| **Administrateur** | Créer les classes et les matières ; affecter les étudiants aux classes et les enseignants aux matières ; gérer les rôles des comptes ; gérer les ressources réservables ; consulter les statistiques de l'établissement ; télécharger n'importe quel bulletin |

Le principe qui structure toute l'application est le **contrôle d'accès basé sur les rôles (RBAC)** : ce qu'un utilisateur voit et ce qu'il peut faire dépendent de son rôle, et cette règle est **vérifiée côté serveur** à chaque requête, pas seulement masquée dans l'interface.

---

## 3. Périmètre fonctionnel

### Fonctionnalités réalisées

| Fonctionnalité | Étudiant | Enseignant | Administrateur |

| Inscription, connexion, déconnexion (JWT)
| Gérer classes, matières, affectation des enseignants et des étudiants
| Gérer les rôles des comptes 
| Saisir des absences et des notes *(ses matières uniquement)* | via l'API |
| Consulter ses notes, absences et sa moyenne 
| Consulter l'emploi du temps de sa classe 
| Consulter les annonces *(globales + sa classe)* 
| Publier des annonces 
| Réserver une salle / du matériel (**détection automatique des conflits de créneaux**)
| Gérer les ressources réservables 
| Notifications internes (cloche, compteur de non-lues)
| Tableau de bord statistique (effectifs, absentéisme, moyennes)
| Bulletin de notes en **PDF** |*(le sien)* | via l'API *(ses classes)* |*(tous)* |

- **Emploi du temps** : l'API permet de lire, créer et supprimer des créneaux, et l'étudiant les consulte dans son tableau de bord. En revanche, **la saisie des créneaux par l'administrateur se fait pour l'instant via l'API** (`POST /api/schedule`) : l'écran d'administration correspondant reste à construire.
- **Annonces ciblées** : l'API sait cibler une classe précise (`classId`). Dans l'interface, le choix de la classe cible n'est pas encore disponible : une annonce publiée depuis l'écran est aujourd'hui **globale**.
- **Notifications** : elles sont internes à l'application (rafraîchies toutes les 30 secondes), pas envoyées par e-mail.
---

## 4. Architecture technique

Architecture **découplée** : une application React (SPA) qui communique avec une API REST *stateless* via des requêtes JSON authentifiées par token.

```
┌──────────────────┐     HTTPS · JSON · JWT      ┌────────────────────┐
│    Frontend      │ ──────────────────────────▶ │      Backend       │
│  React + TS      │ ◀────────────────────────── │  Node.js + Express │
│  Vite + Tailwind │                             │  + TypeScript      │
└──────────────────┘                             └─────────┬──────────┘
        Vercel                                             │ Prisma ORM
                                                           ▼
        Render (API)                              ┌────────────────────┐
                                                  │    PostgreSQL      │
                                                  │       Neon         │
                                                  └────────────────────┘
```

| Couche | Technologie | Pourquoi ce choix |

| Frontend | React 18, TypeScript, Vite, Tailwind CSS | React est la bibliothèque la plus répandue ; TypeScript réduit les erreurs d'intégration avec l'API ; Vite offre un démarrage très rapide |
| Backend | Node.js, Express, TypeScript | Un seul langage des deux côtés ; Express est très documenté |
| Base de données | PostgreSQL + Prisma | Données fortement relationnelles (un étudiant - une classe, une note - un étudiant et une matière) ; Prisma génère les types à partir du schéma |
| Authentification | JWT + bcrypt | API sans état, simple à faire évoluer ; mots de passe hachés avec sel |
| Validation | Zod | Règles de validation centralisées et messages d'erreur clairs |
| PDF | pdfkit | Génération côté serveur, après vérification des droits |
| Tests | Jest + Supertest | Tests d'intégration sur de vraies requêtes HTTP |

### Structure du dépôt
```
smart-campus/
├── backend/
│   ├── prisma/              schéma de données et migrations
│   ├── src/
│   │   ├── config/          connexion à la base (Prisma)
│   │   ├── middleware/      authenticate (token) et authorize (rôles)
│   │   ├── modules/         un dossier par ressource : auth, users, classes,
│   │   │                    subjects, schedule, absences, grades, announcements,
│   │   │                    resources, bookings, notifications, stats, bulletins
│   │   └── utils/           JWT, permissions métier, notifications
│   └── tests/               tests automatisés (Jest + Supertest)
├── frontend/
│   └── src/
│       ├── api/             client HTTP centralisé (token, erreurs, téléchargements)
│       ├── context/         état d'authentification global
│       ├── components/      route protégée, cloche de notifications
│       └── pages/           panneaux Admin / Enseignant / Étudiant, annonces, réservations, stats
└── (documents du projet : cahier des charges, journal technique, guide de déploiement…)
```

### Aperçu de l'API

Toutes les routes, sauf l'inscription, la connexion et l'état de santé, exigent un token (`Authorization: Bearer <token>`).

| Ressource | Routes | Accès |

| `/api/auth` | `POST /register`, `POST /login`, `GET /me` | public, public, connecté |
| `/api/users` | `GET /`, `PATCH /:id` | admin |
| `/api/classes` | `GET /`, `GET /:id` ; `POST`, `PUT /:id`, `DELETE /:id` | connecté ; admin |
| `/api/subjects` | `GET /` ; `POST`, `PUT /:id`, `DELETE /:id` | connecté ; admin |
| `/api/schedule` | `GET /?classId=` ; `POST`, `DELETE /:id` | connecté ; admin |
| `/api/absences` | `GET /` ; `POST`, `PATCH /:id` ; `DELETE /:id` | connecté (filtré par rôle) ; enseignant/admin ; admin |
| `/api/grades` | `GET /` ; `POST`, `DELETE /:id` | connecté (filtré par rôle) ; enseignant/admin |
| `/api/announcements` | `GET /` ; `POST`, `DELETE /:id` | connecté (filtré par rôle) ; enseignant/admin |
| `/api/resources` | `GET /` ; `POST`, `DELETE /:id` | connecté ; admin |
| `/api/bookings` | `GET /`, `POST /`, `DELETE /:id` | connecté *(annulation : son propre créneau, ou admin)* |
| `/api/notifications` | `GET /`, `PATCH /:id`, `PATCH /read-all/mark` | connecté *(les siennes uniquement)* |
| `/api/stats` | `GET /` | admin |
| `/api/bulletins/:studentId` | `GET` → fichier PDF | étudiant (le sien), enseignant (ses classes), admin |
| `/api/health` | `GET` | public |

---
## 5. Modèle de données
Conçu avec la méthode **MERISE** (MCD puis MLD) et implémenté avec Prisma : 10 tables, aucune association plusieurs-à-plusieurs, donc des clés étrangères simples sans table intermédiaire.

Les trois profils (étudiant, enseignant, administrateur) sont regroupés dans une **seule table `User`**, distinguée par un champ `role`. Ce choix simplifie les requêtes et le contrôle d'accès, au prix d'un report de certaines contraintes métier (par exemple « seul un étudiant a une classe ») dans le code applicatif.

---

## 6. Sécurité

Quelques décisions prises délibérément :

- **Mots de passe hachés avec bcrypt** (sel aléatoire par utilisateur) ; jamais stockés ni renvoyés en clair.
- **Le rôle n'est jamais fourni par le client.** À l'inscription, tout compte est `STUDENT`, même si la requête contient `"role": "ADMIN"` (c'est couvert par un test). Seul un administrateur peut promouvoir un compte.
- **Contrôle d'accès vérifié côté serveur**, via deux middlewares réutilisables : `authenticate` (token valide) et `authorize(...rôles)`.
- **Contrôle de propriété au-delà du rôle** : un enseignant ne peut saisir une note ou une absence que pour une matière qu'il enseigne réellement ; un étudiant ne peut télécharger que son propre bulletin ; chacun ne lit que ses propres notifications.
- **Message d'erreur identique** pour un e-mail inconnu et un mot de passe incorrect, afin de ne pas révéler quels comptes existent.
- **Validation des entrées** avec Zod sur les routes d'écriture.
- **Secrets hors du code** : adresse de la base et clé JWT sont fournies par variables d'environnement (`.env` exclu de Git) ; **CORS** restreint à l'adresse du frontend en production.

---

## 7. Installation et lancement en local

### Prérequis

- [Node.js](https://nodejs.org) 18 ou plus (vérifier avec `node -v`)
- [Git](https://git-scm.com)
- Une base **PostgreSQL** : soit locale, soit hébergée gratuitement sur [Neon](https://neon.tech) (sans installation)

### 1. Récupérer le projet

```bash
git clone https://github.com/WILLIAM04052005/smart-campus.git
cd smart-campus
```

### 2. Lancer le backend

```bash
cd backend
npm install
```

Crée le fichier de configuration à partir du modèle :

```bash
# macOS / Linux
cp .env.example .env
# Windows (invite de commandes)
copy .env.example .env
```

Ouvrez `backend/.env` et renseignez les variables :

| Variable | Rôle | Exemple |

| `DATABASE_URL` | Adresse de la base PostgreSQL | `postgresql://user:motdepasse@localhost:5432/smart_campus` |
| `JWT_SECRET` | Clé qui signe les tokens (longue et aléatoire) | *voir la commande ci-dessous* |
| `PORT` | Port de l'API | `4000` |
| `CORS_ORIGIN` | Origine autorisée (laisser vide en local) | *(vide)* |

Pour générer une clé `JWT_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Appliquez les migrations (création des tables) puis démarrez l'API :

```bash
npx prisma migrate deploy
npm run dev
```

L'API tourne sur http://localhost:4000. Vérification : http://localhost:4000/api/health doit afficher `{"status":"ok","database":"connected"}`.

> Avec Neon, utilisez la chaîne de connexion fournie. 

### 3. Lancer le frontend

Dans un **second terminal** (le backend doit rester lancé) :

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur http://localhost:5173. Par défaut, elle appelle l'API sur `http://localhost:4000/api` ; pour pointer vers une autre API, définissez `VITE_API_URL` dans `frontend/.env`.

### 4. Créer un compte administrateur

L'inscription crée toujours un compte **étudiant** (voir la partie Sécurité) : il n'existe volontairement aucun écran pour s'auto-promouvoir. Pour obtenir un premier administrateur :

1. Inscrivez-vous depuis l'application (http://localhost:5173/register).
2. Dans un terminal, ouvrez l'interface de gestion de la base :
   ```bash
   cd backend
   npx prisma studio
   ```
3. Dans la table **User**, changez le champ `role` de votre compte en `ADMIN`, puis enregistrez.
4. Déconnectez-vous et reconnectez-vous dans l'application.

Depuis le panneau d'administration, vous pouvez ensuite créer une classe et une matière, promouvoir un compte en enseignant, l'affecter à la matière, et rattacher un étudiant à la classe.

### Parcours de démonstration conseillé

1. **Admin** : créer une classe, une matière ; promouvoir un second compte en `TEACHER` et l'affecter à la matière ; rattacher un troisième compte (étudiant) à la classe.
2. **Enseignant** : saisir une note et une absence pour l'étudiant.
3. **Étudiant** : voir la notification (cloche), la note, l'absence, puis télécharger son bulletin PDF.
4. **Réservations** : créer une ressource (admin), réserver un créneau, puis tenter un créneau qui chevauche le premier pour voir le conflit détecté.
5. **Admin** : ouvrir l'onglet *Statistiques*.

### Comptes de démonstration (version en ligne)
 Rôle | E-mail | Mot de passe |

| Administrateur | *william.abo@2029.icam.fr* | *Doups2370* |
| Enseignant | *prof@test.com* | *Prof2379* |
| Étudiant | *etudiant@test.com* | *Etude2377* |

---

## 8. Tests automatisés

Cinq suites de tests d'intégration (**Jest + Supertest**) envoient de vraies requêtes HTTP à l'API et vérifient les réponses :

| Fichier | Ce qui est vérifié |
|---|---|
| `auth.test.ts` | Inscription, connexion, rôle forcé à `STUDENT`, messages d'erreur non révélateurs |
| `permissions.test.ts` | Contrôle d'accès : 401 sans token, 403 mauvais rôle, 200 bon rôle |
| `bookings.test.ts` | Détection des conflits de réservation (chevauchement exact, partiel, créneaux adjacents) |
| `stats.test.ts` | Statistiques réservées à l'administrateur, structure de la réponse |
| `bulletins.test.ts` | Droits d'accès au bulletin, PDF valide, identifiant inexistant |

```bash
cd backend
npm test
```
---

## 9. Déploiement

| Brique | Service | Particularité |

| Frontend | **Vercel** | Un `vercel.json` redirige toutes les adresses vers `index.html` (sinon recharger `/login` donne une 404, ces pages n'existant que dans React Router) |
| API | **Render** | Commande de build `npm install --include=dev && npm run build` ; le démarrage applique les migrations (`prisma migrate deploy`) |
| Base de données | **Neon** (PostgreSQL) | Chaîne de connexion fournie à l'API par variable d'environnement |

Le **déploiement est continu** : chaque `git push` sur la branche principale reconstruit et met en ligne la nouvelle version.

Variables d'environnement de production :

- **Render** : `DATABASE_URL`, `JWT_SECRET` (clé distincte de celle du développement), `CORS_ORIGIN` (adresse exacte du frontend, sans `/` final), `PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK=1`
- **Vercel** : `VITE_API_URL` (adresse de l'API, terminée par `/api`)

---

## 10. Documentation du projet

- [Cahier des charges et feuille de route](01-cahier-des-charges.md)
- [Journal des choix techniques](02-journal-technique.md) : décisions, difficultés rencontrées et justifications, sprint par sprint

---

## 11. Limites connues et perspectives

Les limites ci-dessous sont assumées et identifiées.

**Fonctionnel**
- Saisie des créneaux d'emploi du temps par l'administrateur dans l'interface (aujourd'hui via l'API) ; vue « planning » pour l'enseignant.
- Sélecteur de classe dans le formulaire d'annonce (ciblage déjà géré par l'API).
- Créneaux ponctuels (rattrapages, jours fériés) en plus des créneaux hebdomadaires récurrents.
- Notifications par e-mail ; purge automatique des anciennes notifications ; historique des bulletins émis.

**Qualité et fiabilité**
- Base de données dédiée aux tests, isolée de celle du développement.
- Intégration continue (GitHub Actions) : lancer les tests à chaque `git push` avant toute mise en ligne.
- Pagination des listes, aujourd'hui chargées en totalité.

**Expérience utilisateur**
- Maquettes et tests utilisateurs en amont ; l'interface est pensée d'abord pour ordinateur, et son adaptation au mobile reste à vérifier et à améliorer.

**Exploitation**
- Séparer la base de production de celle du développement, conteneuriser avec Docker, ajouter une surveillance du service.

---

## 12. Conclusion

Smart Campus montre une application fullstack menée **de la modélisation à la mise en ligne** : analyse du besoin, modèle de données MERISE, API REST sécurisée avec contrôle d'accès par rôle, interface React adaptée à trois profils, tests automatisés, génération de PDF, et déploiement continu sur trois services.

Je recherche actuellement un ** Stage en développement web fullstack**.

**Contact** : *[abowilliam30@gmail.com, 0758257823]* · **GitHub** : [WILLIAM04052005](https://github.com/WILLIAM04052005)
