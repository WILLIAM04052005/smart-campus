# Journal des choix techniques — Smart Campus

Ce document trace, sprint par sprint, les décisions prises, leurs
justifications, et les difficultés rencontrées. C'est la matière brute du
rapport de soutenance : plus il est rempli au fil de l'eau, moins il y aura
de travail de reconstitution en fin d'année.

> Conseil : après chaque session de travail, ajoutez 2-3 lignes ici tant
> que c'est frais. Même une note brute vaut mieux que rien.

---

## Sprint 0 — Initialisation du projet

**Objectif** : poser une base technique saine avant d'écrire la moindre
fonctionnalité métier.

### Choix techniques et justifications

- **React + TypeScript + Vite** côté frontend plutôt que Create React App :
  Vite est aujourd'hui le standard (CRA est officiellement déprécié), avec
  un démarrage et un rechargement à chaud beaucoup plus rapides.
- **Node.js + Express + TypeScript** côté backend : rester sur le même
  langage (TypeScript) des deux côtés réduit la charge cognitive en solo,
  et Express reste le framework backend Node le plus documenté — un vrai
  avantage pour trouver de l'aide en cas de blocage.
- **PostgreSQL + Prisma ORM** plutôt que MongoDB : les données d'un campus
  (étudiants, classes, notes, emplois du temps) sont fortement
  **relationnelles** (un étudiant appartient à une classe, une note est
  liée à un étudiant ET une matière...). Un SGBD relationnel est donc plus
  adapté qu'une base NoSQL. Prisma a été choisi pour son typage
  automatique en TypeScript (le schéma de données génère directement des
  types utilisables dans le code, ce qui évite des bugs de cohérence).
- **Neon** comme hébergeur PostgreSQL : offre gratuite, sans carte
  bancaire, base accessible depuis n'importe où (pratique pour développer
  sur un seul poste et déployer plus tard sans migration de données).

### Difficultés rencontrées

- *(à compléter : par exemple, la configuration initiale de l'environnement
  Windows — `cp` non reconnu, nécessité d'utiliser `copy`)*

### Décisions à justifier en soutenance

- Pourquoi une architecture "API séparée" (backend REST + frontend SPA)
  plutôt qu'un framework fullstack type Next.js : ce choix permet de bien
  distinguer et présenter séparément les compétences front-end et
  back-end au jury, et prépare un éventuel découplage futur (ex : ajouter
  une app mobile qui consommerait la même API).

---

## Sprint 1 — Authentification

**Objectif** : permettre à un utilisateur de créer un compte, se
connecter, et restreindre l'accès à certaines routes selon son rôle.

### Choix techniques et justifications

- **JWT (JSON Web Token)** plutôt que des sessions serveur classiques :
  une API REST stateless (sans état côté serveur) est plus simple à faire
  évoluer et à déployer (pas de stockage de session à synchroniser). Le
  token est envoyé dans l'en-tête `Authorization: Bearer <token>` à
  chaque requête protégée.
- **bcrypt** pour le hash des mots de passe : un standard éprouvé, qui
  intègre un "salt" aléatoire automatique (deux utilisateurs avec le même
  mot de passe auront des hashs différents en base — protection contre les
  attaques par table arc-en-ciel).
- **zod** pour la validation des données entrantes : centralise les règles
  de validation (format email, longueur du mot de passe...) et génère des
  messages d'erreur clairs, plutôt que de multiplier les `if` manuels.
- **Contrôle d'accès par rôle (RBAC)** via un middleware `authorize(...roles)`
  réutilisable, plutôt que de dupliquer la logique de vérification dans
  chaque route.

### Point de sécurité important à mentionner dans le rapport

À l'inscription, le rôle de l'utilisateur **n'est jamais pris depuis les
données envoyées par le client**. Il est toujours forcé à `STUDENT` par
défaut côté serveur. Sans cette précaution, un attaquant pourrait
simplement ajouter `"role": "ADMIN"` dans sa requête d'inscription et
obtenir un accès administrateur. C'est un exemple concret de la règle
"ne jamais faire confiance aux données envoyées par le client."

### Difficultés rencontrées

- Lors de la mise à jour du projet (copie des nouveaux fichiers du Sprint 1
  dans le dossier existant), certains fichiers n'ont pas été correctement
  écrasés via le copier-coller de l'explorateur Windows, ce qui a d'abord
  fait croire à un bug alors que l'ancienne version du code était encore
  active. Résolu en utilisant `xcopy /Y /E` en ligne de commande pour
  forcer le remplacement.
- *(à compléter avec vos propres remarques)*

### Décisions à justifier en soutenance

- Pourquoi 7 jours d'expiration pour le token JWT (compromis entre
  sécurité — un token volé reste valide moins longtemps qu'un token
  "infini" — et confort d'usage — l'utilisateur n'a pas à se reconnecter
  trop souvent).
- Pourquoi le même message d'erreur ("Email ou mot de passe incorrect")
  est renvoyé que ce soit l'email qui n'existe pas OU le mot de passe qui
  soit faux : évite de révéler à un attaquant si un email est enregistré
  dans la base (énumération de comptes).

---

## Sprint 2 — À venir

*(sera rempli à la prochaine session : classes, emploi du temps,
absences, notes)*

---

## Modèle pour les prochains sprints

Copiez ce squelette à chaque nouveau sprint :

```markdown
## Sprint X — [nom du sprint]

**Objectif** :

### Choix techniques et justifications
-

### Difficultés rencontrées
-

### Décisions à justifier en soutenance
-
```
