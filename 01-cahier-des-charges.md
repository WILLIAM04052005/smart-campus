# Smart Campus — Cahier des charges & feuille de route

Document de référence du projet, à conserver et faire évoluer tout au long
de l'année. Sert de base au rapport de soutenance.

---

## 1. Contexte et problématique

**Contexte fictif à personnaliser** : imaginez un établissement (école,
université, campus privé) qui gère aujourd'hui sa vie académique via des
outils dispersés — tableurs Excel pour les emplois du temps, e-mails pour
les annonces, formulaires papier pour les réservations de salles, etc.

> À faire par vous : choisissez un établissement "cible" réaliste (taille,
> type de formation, nombre d'étudiants approximatif). Ça donnera de la
> substance à la partie "analyse du besoin" du rapport. Exemple : "un
> centre de formation de 300 étudiants répartis sur 4 filières."

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

### MVP (Minimum Viable Product) — priorité absolue, à livrer en premier

- [ ] Authentification (inscription/connexion, 3 rôles, JWT)
- [ ] Gestion des utilisateurs (CRUD, réservé admin)
- [ ] Gestion des classes / groupes / matières
- [ ] Emploi du temps (consultation par rôle, création/édition par admin)
- [ ] Gestion des absences (saisie enseignant, consultation étudiant)
- [ ] Gestion des notes (saisie enseignant, consultation étudiant, bulletin simple)

### Fonctionnalités intermédiaires — à ajouter une fois le MVP stable

- [ ] Espace annonces / actualités (par classe ou global)
- [ ] Messagerie simple entre utilisateurs
- [ ] Réservation de ressources (salles, matériel) avec calendrier
- [ ] Notifications (email ou in-app) pour absences/notes/annonces

### Fonctionnalités avancées — "bonus" si le temps le permet

- [ ] Tableau de bord statistiques (taux d'absentéisme, moyennes par classe...)
- [ ] Export PDF des bulletins
- [ ] Recherche globale
- [ ] Mode sombre / PWA (installable sur mobile)

> Conseil de soutenance : un jury préfère un MVP **complet, propre et
> testé** plutôt que 15 fonctionnalités à moitié finies. Mieux vaut
> annoncer clairement dans le rapport ce qui est "réalisé" vs "perspectives
> d'évolution."

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
- **Tests** : au moins les routes critiques (auth, permissions) avec Jest +
  Supertest

## 5. Modèle de données simplifié (à affiner ensemble)

Entités principales : `User`, `Role`, `Class`, `Subject`, `Schedule`,
`Absence`, `Grade`, `Announcement`, `Resource`, `Booking`.

> On construira le schéma Prisma précis (avec les relations) dès qu'on
> attaque le développement du backend.

## 6. Planning prévisionnel (9 mois, à ajuster selon votre rythme)

| Période | Phase | Livrable |
|---|---|---|
| **Sept.** | Cadrage — cahier des charges, maquettes, choix techniques finalisés | Ce document + wireframes |
| **Oct. – Nov.** | Sprint 1 — Auth, gestion utilisateurs, base de données | Backend + frontend connectés, login fonctionnel |
| **Déc. – Janv.** | Sprint 2 — Emploi du temps, absences, notes (MVP complet) | Démo MVP fonctionnelle |
| **Févr. – Mars** | Sprint 3 — Fonctionnalités intermédiaires + tests | Version quasi-finale |
| **Avril** | Finalisation — corrections, déploiement, documentation technique | Application déployée en ligne |
| **Mai** | Rédaction du rapport + préparation du support de soutenance | Rapport + slides |
| **Juin** | Répétitions, marge de sécurité | Prêt pour la soutenance |

## 7. Livrables attendus pour la soutenance

1. **Le code source** (dépôt Git propre, historique de commits lisible)
2. **L'application déployée** (démo live possible devant le jury)
3. **Le rapport écrit** : contexte, analyse du besoin, choix techniques
   justifiés, architecture, difficultés rencontrées et solutions, bilan et
   perspectives
4. **Le support de soutenance** (slides) pour la présentation orale

## 8. Prochaine étape immédiate

- Valider ou ajuster ce périmètre fonctionnel avec moi
- Décider du nom définitif du projet et de l'établissement fictif
  (contexte)
- Puis : initialisation du dépôt Git + structure du projet (Sprint 0)
