# Smart Campus — Cahier des charges & feuille de route
---

## 1. Contexte et problématique

**Contexte dans Readme** 

**Problématique** : comment centraliser la gestion de la vie académique
(emploi du temps, notes, absences, communication, réservation de
ressources) dans une seule plateforme, accessible selon le rôle de chaque
utilisateur ?

## 2. Utilisateurs cibles (personas)

| Rôle | Besoins principaux |
|---|---|
| **Étudiant** | Consulter son emploi du temps, ses notes, ses absences ; recevoir des annonces ; réserver une ressource (salle de travail, matériel) |
| **Enseignant** | Saisir les notes et absences de ses groupes ; publier des annonces à sa classe ; consulter son propre planning |
| **Administrateur** | Gérer les utilisateurs, les classes, les emplois du temps ; superviser l'ensemble de la plateforme ; statistiques globales |

## 3. Périmètre fonctionnel

### MVP (Minimum Viable Product)

- Authentification (inscription/connexion, 3 rôles, JWT)
- Gestion des utilisateurs (CRUD, réservé admin)
- Gestion des classes / groupes / matières
- Emploi du temps (consultation par rôle, création/édition par admin)
- Gestion des absences (saisie enseignant, consultation étudiant)
- Gestion des notes (saisie enseignant, consultation étudiant, bulletin simple)

### Fonctionnalités intermédiaires

- Espace annonces / actualités (par classe ou global)
- Messagerie simple entre utilisateurs
- Réservation de ressources (salles, matériel) avec calendrier
- Notifications (email ou in-app) pour absences/notes/annonces

### Fonctionnalités en plus

- Tableau de bord statistiques (taux d'absentéisme, moyennes par classe...)
- Export PDF des bulletins
- Recherche globale
- Mode sombre / PWA (installable sur mobile)

## 4. Architecture technique

```
┌─────────────────┐        HTTPS / REST API        ┌──────────────────┐
│   Frontend       │ ───────────────────────────▶  │   Backend         │
│  React + TS      │ ◀───────────────────────────  │  Node.js/Express  │
│  (Vercel)         │        JSON + JWT              │  + TypeScript     │
└─────────────────┘                                 └────────┬─────────┘
                                                              │ Prisma ORM
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   PostgreSQL      │
                                                     │   (Neon / Railway)│
                                                     └──────────────────┘
```

- **API REST** organisée par ressource (`/api/users`, `/api/schedules`,
  `/api/grades`, `/api/absences`...)
- **Contrôle d'accès par rôle** (middleware d'autorisation sur chaque route)
- **Validation des données** côté backend (zod ou express-validator)
- **Tests**

## 5. Modèle de données simplifié (à affiner ensemble)

Entités principales : `User`, `Role`, `Class`, `Subject`, `Schedule`,
`Absence`, `Grade`, `Announcement`, `Resource`, `Booking`.
