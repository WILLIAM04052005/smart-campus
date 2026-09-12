# Smart Campus (NextCampus)

Plateforme de gestion de vie académique — projet de fin d'études B3
Développeur Web Fullstack.

Voir `01-cahier-des-charges.md` pour le contexte, le périmètre fonctionnel
et le planning du projet.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL + Prisma ORM

## Structure du dépôt

```
smart-campus/
├── backend/    → API REST (Express + Prisma)
├── frontend/   → Application React
└── 01-cahier-des-charges.md
```

## Prérequis

- [Node.js](https://nodejs.org) version 18 ou plus (vérifier avec `node -v`)
- Une base PostgreSQL accessible. Deux options simples et gratuites :
  - [Neon](https://neon.tech) (recommandé, sans installation)
  - [Railway](https://railway.app)
  - Ou PostgreSQL installé en local

## Installation — Backend

```bash
cd backend
npm install
cp .env.example .env
# Ouvrez .env et collez votre DATABASE_URL (Neon/Railway/local)

npx prisma migrate dev --name init   # crée les tables en base
npm run dev                          # démarre le serveur sur http://localhost:4000
```

Vérifiez que ça fonctionne en ouvrant : http://localhost:4000/api/health
Vous devez voir `{"status":"ok","database":"connected"}`.

## Installation — Frontend

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev    # démarre l'app sur http://localhost:5173
```

Ouvrez http://localhost:5173 : si tout fonctionne, vous verrez
"✓ Frontend ↔ Backend ↔ Base de données OK".

## État d'avancement

- [x] **Sprint 0** — Structure du projet, connexion DB, health check
- [x] **Sprint 2** — Classes, matières, emploi du temps, absences, notes :
  - Backend : CRUD complet pour `/api/classes`, `/api/subjects`,
    `/api/schedule`, `/api/absences`, `/api/grades`, et
    `/api/users` (gestion des rôles/classes par un admin)
  - Permissions fines : un enseignant ne peut saisir une absence/note que
    pour une matière qu'il enseigne réellement (vérifié côté serveur)
  - Frontend : trois interfaces différentes selon le rôle connecté —
    `AdminPanel` (gestion classes/matières/utilisateurs), `TeacherPanel`
    (saisie absences/notes), `StudentPanel` (consultation emploi du
    temps/notes/absences)

⚠️ **Le schéma de base de données a changé** (nouveaux modèles Subject,
ScheduleEntry, Absence, Grade). Après avoir récupéré ces fichiers, il faut
relancer la migration :
```
cd backend
npx prisma migrate dev --name sprint2_academic_models
```

- [x] **Sprint 3 (fonctionnalités)** — Annonces et réservation de ressources :
  - Backend : `/api/announcements` (annonces globales ou ciblées sur une
    classe), `/api/resources` (CRUD admin), `/api/bookings` (réservation
    de créneaux avec détection automatique des conflits d'horaires)
  - Frontend : nouvel onglet "Annonces" (lecture pour tous, publication
    pour enseignant/admin) et "Réservations" (visible par tous, création
    de ressources réservée à l'admin)

⚠️ **Le schéma a encore changé** (modèles Announcement, Resource,
Booking). Relancez la migration après avoir copié les fichiers :
```
cd backend
npx prisma migrate dev --name sprint3_announcements_bookings
```

- [x] **Sprint 4 (tests)** — Suite de tests automatisés (Jest + Supertest) :
  - `tests/auth.test.ts` — inscription, connexion, sécurité (rôle forcé à
    STUDENT, messages d'erreur non-révélateurs)
  - `tests/permissions.test.ts` — contrôle d'accès par rôle (401 sans
    token, 403 mauvais rôle, 200 bon rôle)
  - `tests/bookings.test.ts` — détection des conflits de créneaux de
    réservation (chevauchement exact, partiel, créneaux adjacents)

### Lancer les tests

```
cd backend
npm install
npm test
```

⚠️ Ces tests s'exécutent contre votre base de données réelle (celle de
votre `.env`) et nettoient automatiquement les données qu'ils créent
(`afterAll`). C'est une simplification pédagogique assumée : dans un
projet professionnel, on utiliserait une base de données dédiée aux
tests, complètement isolée de la base de développement — c'est une piste
d'amélioration à mentionner dans le rapport si vous voulez montrer que
vous connaissez la bonne pratique.

⚠️ **Après avoir récupéré ces changements**, pensez à relancer
`npm install` dans `backend` ET dans `frontend` (nouvelles dépendances :
bcrypt, jsonwebtoken, zod, react-router-dom), puis à relancer
`npx prisma generate` dans `backend` si besoin.

### Tester l'authentification

1. Démarrez le backend (`npm run dev` dans `backend`) et le frontend
   (`npm run dev` dans `frontend`)
2. Ouvrez http://localhost:5173 → vous êtes redirigé vers `/login`
3. Cliquez sur "Inscrivez-vous", créez un compte
4. Vous êtes automatiquement connecté et redirigé vers le tableau de bord
5. Rafraîchissez la page : vous restez connecté (le token est vérifié via
   `/api/auth/me`)
6. Cliquez sur "Se déconnecter" pour tester la déconnexion

## Prochaines étapes (Sprint 4)

- [ ] Notifications (email ou in-app)
- [ ] Tests automatisés (Jest + Supertest) sur les routes critiques
- [ ] Finaliser le déploiement (voir `03-guide-deploiement.md`)
- [ ] Export PDF des bulletins (bonus)
- [ ] Tableau de bord statistiques (bonus)

## Git — premiers pas

```bash
git init
git add .
git commit -m "Sprint 0 : initialisation du projet (structure, config, health check)"
```

Pensez à créer un dépôt GitHub et à pousser régulièrement — un historique
de commits clair et régulier est un vrai plus pour le rapport et la
soutenance (ça prouve un travail progressif, pas fait à la dernière
minute).
