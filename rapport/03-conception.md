# 3. Conception

*(Section rédigée, prête à être intégrée au rapport. Les passages entre
crochets [ainsi] sont des indications à personnaliser ou à vérifier —
supprimez les crochets une fois adaptés.)*

## 3.1 Architecture technique générale

Le choix d'architecture retenu pour Smart Campus repose sur une
**séparation stricte entre le frontend et le backend**, communiquant
exclusivement via une API REST. Cette approche, parfois désignée par
l'acronyme SPA (*Single Page Application*) côté client couplée à une API
stateless côté serveur, s'oppose à une architecture "monolithique" où le
serveur générerait directement les pages HTML.

```
┌─────────────────┐        HTTPS / REST API        ┌──────────────────┐
│   Frontend        │ ───────────────────────────▶  │   Backend          │
│  React + TypeScript│ ◀───────────────────────────  │  Node.js/Express   │
│  (Vite)            │        JSON + JWT              │  + TypeScript      │
└─────────────────┘                                 └────────┬─────────┘
                                                              │ Prisma ORM
                                                              ▼
                                                     ┌──────────────────┐
                                                     │   PostgreSQL       │
                                                     │   (Neon)           │
                                                     └──────────────────┘
```

Ce choix se justifie par plusieurs raisons, techniques et pédagogiques :

- Il permet de **démontrer distinctement** les compétences front-end et
  back-end attendues d'un développeur fullstack, chaque couche étant
  clairement identifiable dans le code et dans ce rapport.
- Il **prépare naturellement une évolution future** de la plateforme : la
  même API pourrait, à terme, être consommée par une application mobile
  ou un autre client, sans aucune modification côté serveur.
- Il correspond à un standard largement répandu dans l'industrie du
  développement web, ce qui rend les compétences développées directement
  transférables en contexte professionnel.

Le choix des technologies pour chaque couche a été guidé par un principe
de cohérence et de pragmatisme, plus que par la recherche de l'outil le
plus récent ou le plus sophistiqué :

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | React + TypeScript + Vite | React reste la bibliothèque front-end la plus demandée sur le marché ; TypeScript apporte un typage statique qui réduit les erreurs d'intégration entre front et back ; Vite offre un temps de démarrage et de rechargement à chaud nettement supérieur aux outils historiques (Create React App, aujourd'hui déprécié) |
| Styles | Tailwind CSS | Permet un style cohérent et rapide à mettre en œuvre sans quitter le fichier de composant, particulièrement adapté à un développement solo où la vitesse d'itération compte |
| Backend | Node.js + Express + TypeScript | Rester sur le même langage (TypeScript) des deux côtés réduit la charge mentale de bascule entre deux syntaxes ; Express demeure le framework backend Node le mieux documenté, un atout en cas de blocage |
| Base de données | PostgreSQL + Prisma ORM | Les données d'un établissement scolaire sont fortement relationnelles (un étudiant appartient à une classe, une note est liée à un étudiant et une matière) : un SGBD relationnel est donc plus adapté qu'une base NoSQL ; Prisma génère automatiquement des types TypeScript à partir du schéma de données, ce qui supprime une source fréquente d'incohérences entre le modèle de données et le code applicatif |
| Authentification | JWT (JSON Web Token) | Une API REST sans état (*stateless*) est plus simple à faire évoluer et à déployer qu'une gestion de sessions côté serveur, qui nécessiterait un stockage partagé entre plusieurs instances du serveur |

L'authentification et le contrôle d'accès méritent une mention
particulière au niveau architectural : chaque requête vers une route
protégée transite par un middleware d'authentification (vérification du
token) puis, le cas échéant, par un middleware d'autorisation
(vérification du rôle). Cette logique transversale, centralisée dans deux
fonctions réutilisables, est appliquée de façon uniforme sur l'ensemble
des routes métier de l'application — un exemple concret du principe de
responsabilité unique et de réduction de la duplication de code.

## 3.2 Modélisation des données (MERISE)

La conception de la base de données a suivi la méthode MERISE, avec la
construction successive d'un Modèle Conceptuel de Données (MCD) puis
d'un Modèle Logique de Données (MLD). Le détail complet de cette
modélisation (dictionnaire des données, table des associations et
cardinalités, schéma relationnel) figure en **annexe [n°X]** de ce
rapport.

Le modèle de données s'articule autour de neuf entités principales :
UTILISATEUR, CLASSE, MATIERE, CRENEAU (emploi du temps), ABSENCE, NOTE,
ANNONCE, RESSOURCE et RESERVATION. L'ensemble des associations entre ces
entités sont de cardinalité maximale (0,n) ou (1,n) d'un côté et (0,1) ou
(1,1) de l'autre — il n'existe aucune association de type plusieurs-à-
plusieurs (n,n) dans ce modèle, ce qui a permis de traduire chaque
association du MCD par une simple clé étrangère dans le MLD, sans
nécessiter de table d'association intermédiaire.

Deux choix de modélisation méritent d'être explicités et justifiés :

**La fusion des profils utilisateurs en une seule entité.** Une
modélisation MERISE "manuel" aurait pu représenter les trois profils
(étudiant, enseignant, administrateur) comme des sous-types d'une entité
générique UTILISATEUR, au moyen d'une relation de spécialisation avec
contrainte d'exclusion (CIF). J'ai fait le choix, courant en
développement web professionnel, de fusionner ces sous-types en une seule
entité discriminée par un attribut `role`. Ce choix simplifie
considérablement les requêtes (pas de jointure supplémentaire pour
connaître le rôle d'un utilisateur) et l'implémentation du contrôle
d'accès, au prix d'un report de certaines contraintes métier (par
exemple, "seul un étudiant est rattaché à une classe") du schéma de
données vers la couche applicative.

**Une légère redondance assumée sur l'entité CRENEAU.** Le modèle prévoit
que chaque créneau d'emploi du temps porte à la fois une référence vers
la matière concernée et vers la classe concernée, alors que la classe
pourrait techniquement être déduite de la matière (chaque matière
appartenant elle-même à une classe unique). Cette redondance volontaire
évite une jointure supplémentaire lors de l'affichage de l'emploi du
temps d'une classe, au prix d'un risque d'incohérence si les deux valeurs
venaient à diverger — risque jugé acceptable ici, la création d'un
créneau se faisant systématiquement via l'interface d'administration qui
garantit la cohérence des deux champs au moment de la saisie.

## 3.3 Maquettes et choix d'interface

*[Point à personnaliser selon ce que vous avez réellement produit.]*

Compte tenu du format du projet — développement en solo sur plusieurs
mois, avec des itérations fréquentes sur le périmètre fonctionnel — je
n'ai pas produit de maquettes formelles (Figma ou équivalent) en amont du
développement. Les choix d'interface ont été faits directement au niveau
du code, en m'appuyant sur des schémas d'interaction déjà éprouvés et
largement répandus dans les applications de gestion : navigation par
onglets pour distinguer les grandes fonctions de la plateforme (tableau
de bord, annonces, réservations), affichage conditionnel de l'interface
selon le rôle de l'utilisateur connecté, et retours visuels immédiats
(messages de succès ou d'erreur) après chaque action.

Cette approche a permis de gagner en rapidité de développement sur un
projet solo, mais représente une limite assumée par rapport à une
démarche de conception centrée utilisateur plus rigoureuse, qui aurait
inclus des maquettes validées avant développement, voire des tests
utilisateurs. C'est un axe d'amélioration identifié pour une éventuelle
suite du projet (voir la partie Bilan et perspectives).

---

## Note pour la suite de la rédaction

- Si vous avez effectivement esquissé des maquettes à un moment du
  projet (même informelles, sur papier), remplacez le paragraphe 3.3 par
  leur description et insérez-les en annexe — c'est un vrai plus pour le
  rapport.
- Pensez à numéroter vos annexes au fur et à mesure et à mettre à jour
  les références "[annexe n°X]" une fois la mise en page finale du
  rapport réalisée.
- Si vous le souhaitez, je peux vous aider à produire rapidement une
  maquette simple (basse fidélité) à ajouter en annexe, pour montrer une
  démarche de conception plus complète — dites-le-moi.
