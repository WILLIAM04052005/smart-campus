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
- Erreur de syntaxe Git (`push -u origin main` au lieu de
  `git push -u origin main`) — rappel qu'une commande Git commence
  toujours par `git`, une confusion fréquente en début d'apprentissage
  de la ligne de commande.

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

## Sprint 2 — Classes, matières, emploi du temps, absences, notes

**Objectif** : construire le cœur métier de la plateforme — la gestion
académique elle-même — avec des permissions différentes selon le rôle.

### Choix techniques et justifications

- **Modélisation relationnelle** : `Class` → `Subject` → (`ScheduleEntry`,
  `Absence`, `Grade`). Chaque matière appartient à une classe et,
  optionnellement, à un enseignant. Ce choix reflète directement
  l'organisation réelle d'un établissement (un cours = une matière +
  une classe + un enseignant), ce qui rend le modèle facile à expliquer
  et à justifier devant un jury.
- **Permissions vérifiées côté serveur, jamais côté client uniquement** :
  chaque route métier revérifie les droits (`authorize`, et pour les
  enseignants, `teacherOwnsSubject`). Le frontend adapte l'affichage par
  confort d'usage, mais la vraie protection est toujours côté API — un
  utilisateur malveillant pourrait sinon appeler l'API directement en
  contournant l'interface.
- **`teacherOwnsSubject` (fonction utilitaire partagée)** : évite de
  dupliquer la même vérification de sécurité dans les modules absences
  et grades (principe DRY — Don't Repeat Yourself). Centraliser cette
  règle réduit aussi le risque d'oubli si la logique doit changer plus
  tard.
- **Interface frontend "role-based"** : trois composants distincts
  (`AdminPanel`, `TeacherPanel`, `StudentPanel`) affichés conditionnellement
  selon `user.role`, plutôt qu'une seule page avec plein de `if` partout.
  Plus lisible, plus facile à faire évoluer indépendamment.

### Point de sécurité important à mentionner dans le rapport

La promotion d'un utilisateur en `TEACHER` ou `ADMIN` ne peut se faire que
via la route `PATCH /api/users/:id`, elle-même protégée par
`authorize("ADMIN")`. Combiné à la règle du Sprint 1 (le rôle n'est jamais
pris depuis l'inscription publique), il est donc impossible pour un
utilisateur de s'auto-promouvoir : la chaîne de confiance part toujours
d'un admin existant.

### Difficultés rencontrées

- Erreur `EADDRINUSE: address already in use :::4000` en relançant le
  backend après une mise à jour : un ancien terminal (issu d'une session
  de travail précédente) faisait déjà tourner le serveur sur le même
  port. Résolu en fermant l'ancien terminal — bon réflexe à garder :
  toujours vérifier qu'un seul serveur backend tourne à la fois.
- Confusion initiale sur Prisma Studio ("dois-je le télécharger ?") :
  clarifié que `npx prisma studio` utilise directement l'outil déjà
  présent dans les dépendances installées via `npm install`, sans
  installation séparée ni connexion à un service externe.

### Décisions à justifier en soutenance

- Pourquoi les créneaux de l'emploi du temps sont "récurrents"
  (jour de la semaine + heure, pas une date précise) plutôt qu'un
  événement unique par date : plus simple à gérer pour un emploi du temps
  hebdomadaire classique ; une évolution vers des créneaux ponctuels
  (rattrapages, jours fériés) serait une piste d'amélioration à mentionner
  dans les perspectives du rapport.
- Pourquoi un étudiant ne peut pas s'auto-affecter à une classe (c'est un
  admin qui le fait) : cohérent avec le fonctionnement réel d'un
  établissement, où l'inscription administrative est un acte de gestion,
  pas un choix libre de l'étudiant.

---

## Sprint 3 — Annonces et réservation de ressources

**Objectif** : ajouter deux fonctionnalités transverses, utiles à tous
les rôles, qui enrichissent la vie "communautaire" de la plateforme.

### Choix techniques et justifications

- **Annonces avec portée optionnelle** (`classId` nullable) : une seule
  table gère à la fois les annonces globales et les annonces ciblées,
  plutôt que deux systèmes séparés. Plus simple à maintenir, et la
  requête de visibilité (`WHERE classId IS NULL OR classId = ...`) reste
  lisible.
- **Détection de conflit de créneaux pour les réservations** : plutôt que
  d'interdire toute réservation multiple sur une ressource, on calcule
  précisément le chevauchement entre deux intervalles horaires
  (`startA < endB ET endA > startB`). C'est une pièce de logique métier
  assez classique (calendriers, plannings) qu'il est utile de savoir
  expliquer et justifier mathématiquement en soutenance.
- **Permissions différenciées par ressource** : n'importe quel utilisateur
  connecté peut réserver un créneau (cohérent avec l'usage réel — un
  étudiant peut vouloir réserver une salle de travail), mais seul un
  admin peut créer/supprimer les ressources elles-mêmes. Une même
  fonctionnalité peut donc avoir des permissions différentes selon
  l'action (lire/réserver vs. administrer).

### Difficultés rencontrées

- Pendant la construction du schéma, le modèle `Grade` a été
  accidentellement supprimé lors d'une modification du fichier
  `schema.prisma` (une erreur de copier-remplacer). Repéré immédiatement
  en relisant le fichier avant de continuer — bon réflexe à garder :
  toujours revérifier un fichier de schéma après une modification
  importante, avant de lancer une migration.
- *(à compléter avec vos propres remarques)*

### Décisions à justifier en soutenance

- Pourquoi la vérification de chevauchement se fait côté serveur et pas
  seulement côté interface : deux utilisateurs pourraient techniquement
  tenter de réserver le même créneau au même moment (condition de course) ;
  seule une vérification côté base de données/serveur au moment de la
  création garantit l'intégrité des données.
- Pourquoi un enseignant peut supprimer ses propres annonces mais pas
  celles des autres enseignants (alors qu'un admin peut tout supprimer) :
  principe de moindre privilège — chacun ne contrôle que ce qu'il a
  produit, sauf l'administrateur qui supervise l'ensemble.

---

## Sprint 3bis — Préparation au déploiement

**Objectif** : avoir une version de l'application accessible en ligne,
sans dépendre d'un poste local allumé, pour la démo de soutenance.

### Choix techniques et justifications

- **Render (backend) + Vercel (frontend) + Neon (base de données)** :
  trois services gratuits, chacun spécialisé dans un type d'hébergement
  (API Node, sites statiques/SPA, PostgreSQL managé). Cette séparation
  reflète une architecture professionnelle réelle, où chaque brique peut
  être choisie, remplacée ou mise à l'échelle indépendamment.
- **Déploiement continu via GitHub** : chaque `git push` redéploie
  automatiquement. Choix pragmatique pour un projet solo sur plusieurs
  mois — évite les déploiements manuels oubliés ou une version en ligne
  qui diverge du code source.
- **`prisma migrate deploy` intégré au script de démarrage** : garantit
  que la base de données en production reste toujours synchronisée avec
  le schéma du code déployé, sans étape manuelle à ne pas oublier.
- **CORS restreint par variable d'environnement** (`CORS_ORIGIN`) : en
  local, CORS reste ouvert (`*`) pour simplifier le développement ; en
  production, il est restreint à l'URL exacte du frontend déployé — une
  bonne pratique de sécurité simple à expliquer en soutenance.

### Difficultés rencontrées

- *(à compléter : par exemple les temps de "cold start" du plan gratuit
  Render — le service s'endort après 15 min d'inactivité)*

### Décisions à justifier en soutenance

- Pourquoi ne pas avoir choisi une solution "tout-en-un" (ex: un VPS
  unique hébergeant front + back + DB) : les plateformes spécialisées
  (Render/Vercel/Neon) offrent un déploiement continu et une gestion des
  environnements beaucoup plus simples à opérer en solo, sans
  compétences DevOps avancées (configuration serveur, reverse proxy,
  certificats SSL...) — un compromis pragmatique assumé, à mentionner
  comme telle dans les perspectives ("une containerisation Docker +
  déploiement sur un VPS serait une piste d'évolution vers plus
  d'autonomie d'hébergement").

> Note : le déploiement effectif (création des comptes Render/Vercel,
> configuration des variables d'environnement en ligne) a été repoussé
> à plus tard dans le projet, une fois les fonctionnalités plus abouties
> — voir `03-guide-deploiement.md` pour la marche à suivre le moment venu.

---

## Sprint 4 — Tests automatisés

**Objectif** : valider par le code, plutôt qu'à l'œil, que les
fonctionnalités critiques (authentification, permissions, logique
métier) se comportent comme prévu — et pouvoir détecter automatiquement
une régression si un futur changement casse quelque chose.

### Choix techniques et justifications

- **Jest + Supertest** : combinaison standard dans l'écosystème
  Node/Express. Supertest permet de simuler de vraies requêtes HTTP
  contre l'application Express (`app`) sans avoir besoin de démarrer un
  vrai serveur sur un port réseau.
- **Tests d'intégration plutôt que tests unitaires isolés** : plutôt que
  de tester des fonctions isolément avec des données simulées (mocks), on
  teste des scénarios complets (requête HTTP → middleware → base de
  données → réponse). Plus représentatif du fonctionnement réel de
  l'application, plus simple à écrire pour un projet de cette taille.
- **Trois axes de test choisis délibérément** :
  1. **Authentification** — la porte d'entrée de toute la plateforme,
     avec un focus sur les failles de sécurité classiques (auto-promotion
     de rôle, énumération de comptes via les messages d'erreur).
  2. **Permissions (RBAC)** — le mécanisme transversal utilisé par
     presque toutes les routes métier ; le tester une fois sur la route
     d'exemple valide la fiabilité du middleware `authorize` partout où
     il est utilisé.
  3. **Logique métier non triviale** — la détection de chevauchement de
     créneaux est le seul endroit du projet avec une vraie logique
     algorithmique (comparaison d'intervalles) ; c'est l'endroit le plus
     susceptible de contenir un bug subtil (erreur de comparaison stricte
     vs. non stricte aux limites d'un intervalle, par exemple), donc le
     plus utile à tester avec plusieurs cas limites (chevauchement exact,
     partiel, créneaux adjacents).

### Limite assumée (à mentionner honnêtement dans le rapport)

Les tests s'exécutent contre la base de données de développement
réelle (nettoyée après coup via `afterAll`), plutôt que contre une base
de test isolée. C'est un choix pragmatique pour un projet solo sur un
temps limité, mais ce n'est pas la pratique professionnelle recommandée
(qui utiliserait une base de données dédiée, réinitialisée avant chaque
suite de tests). C'est le genre de limite qu'il vaut mieux annoncer
soi-même en soutenance plutôt que de laisser le jury la découvrir — ça
montre que vous connaissez la bonne pratique même si vous ne l'avez pas
mise en œuvre faute de temps.

### Difficultés rencontrées

- *(à compléter avec vos propres remarques)*

### Décisions à justifier en soutenance

- Pourquoi tester le chevauchement de créneaux avec un cas "adjacent"
  (11h-12h après 9h-11h) : c'est un cas limite classique où une erreur
  d'implémentation est facile (utiliser `<=`/`>=` au lieu de `<`/`>`
  transformerait par erreur des créneaux consécutifs en "conflit"). Le
  tester explicitement prouve que la logique est correcte, pas seulement
  qu'elle semble fonctionner sur un cas simple.

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
