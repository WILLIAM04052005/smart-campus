# 4. Réalisation

*(Section rédigée, prête à être intégrée au rapport. Les passages entre
crochets [ainsi] sont des indications à personnaliser ou à vérifier —
supprimez les crochets une fois adaptés.)*

## 4.1 Environnement et outils de développement

Le développement s'est déroulé sur un poste personnel sous Windows, avec
Node.js comme environnement d'exécution JavaScript/TypeScript, et Git
associé à un dépôt GitHub pour le versionnement du code. Chaque étape
significative du projet a fait l'objet d'un commit dédié et documenté,
ce qui a permis de conserver un historique lisible de la progression du
projet — historique consultable directement sur le dépôt GitHub
[insérer le lien] et qui peut appuyer, si besoin, la démonstration d'un
travail réalisé progressivement tout au long de l'année plutôt que dans
l'urgence.

Le projet a été structuré en un dépôt unique contenant deux
sous-projets indépendants (`backend` et `frontend`), chacun avec son
propre fichier `package.json` et ses propres dépendances, mais partageant
une même base de code source pour en faciliter la consultation par le
jury.

Le développement a suivi une logique de sprints successifs, chacun
correspondant à un ensemble cohérent de fonctionnalités, documentés au
fil de l'eau dans un journal technique tenu tout au long du projet (voir
annexe). Cette méthode, inspirée des pratiques agiles sans en reprendre
tout le formalisme (pas de réunions d'équipe, le projet étant mené en
solo), a permis de garder une vision claire de l'avancement et de
constituer, sprint après sprint, la matière première de ce rapport.

## 4.2 Authentification et sécurité

L'authentification constitue le socle sur lequel repose l'ensemble du
contrôle d'accès de la plateforme ; elle a donc été développée en
priorité, immédiatement après la mise en place de l'architecture de
base.

Le mécanisme retenu repose sur des **tokens JWT (JSON Web Token)**.
Lorsqu'un utilisateur se connecte avec succès, le serveur génère un
token signé contenant son identifiant et son rôle, valable sept jours.
Ce token est ensuite transmis par le client dans l'en-tête
`Authorization` de chaque requête vers une route protégée ; un middleware
dédié (`authenticate`) le vérifie et le décode avant de laisser la
requête poursuivre son traitement. Un second middleware (`authorize`),
paramétrable par la liste des rôles autorisés, est combiné au premier sur
les routes qui doivent en outre restreindre l'accès à un ou plusieurs
rôles précis (par exemple, la création d'une classe est réservée aux
administrateurs).

Les mots de passe ne sont à aucun moment stockés en clair : ils sont
hachés avec **bcrypt**, un algorithme qui intègre un "sel" aléatoire
propre à chaque utilisateur, empêchant que deux comptes partageant le
même mot de passe n'aient le même hash en base de données.

Au-delà de ces mécanismes standards, plusieurs décisions de sécurité plus
fines ont été prises consciemment au fil du développement, et méritent
d'être mises en avant car elles illustrent une réflexion allant au-delà
du simple "faire fonctionner" :

- **Le rôle d'un utilisateur n'est jamais déterminé par les données qu'il
  envoie lui-même.** À l'inscription, tout nouveau compte est créé avec
  le rôle `STUDENT`, quelle que soit la valeur éventuellement envoyée
  dans la requête. La promotion d'un compte vers `TEACHER` ou `ADMIN` ne
  peut se faire que via une route dédiée, elle-même protégée et réservée
  aux administrateurs déjà existants. Cette règle empêche qu'un
  utilisateur malveillant ne puisse s'auto-attribuer des privilèges
  élevés en modifiant simplement le corps d'une requête HTTP — une faille
  malheureusement fréquente dans les applications construites sans cette
  précaution.
- **Un message d'erreur identique en cas d'échec de connexion**, que
  l'email soit inconnu ou que le mot de passe soit incorrect. Cette
  symétrie volontaire empêche un attaquant de déduire, par tâtonnement,
  quels emails correspondent à des comptes existants (technique
  d'énumération de comptes).
- **Une vérification systématique de propriété métier**, au-delà du
  simple rôle : un enseignant authentifié en tant que `TEACHER` ne peut
  saisir une absence ou une note que pour une matière qu'il enseigne
  réellement, vérification effectuée côté serveur avant toute écriture en
  base de données. Un contrôle de rôle seul aurait été insuffisant :
  n'importe quel enseignant aurait alors pu modifier les notes de
  n'importe quelle classe.

## 4.3 Fonctionnalités développées

Le développement des fonctionnalités métier s'est organisé en trois
paliers successifs, correspondant au périmètre fonctionnel défini lors de
la phase d'analyse des besoins (voir partie 2.3).

**Le socle fonctionnel (MVP)** comprend la gestion des classes et des
matières (création, modification, suppression, réservées aux
administrateurs), l'emploi du temps (créneaux récurrents rattachés à une
classe et une matière), la gestion des absences et des notes. Chacune de
ces fonctionnalités présente une interface différente selon le rôle
connecté : un administrateur dispose d'un panneau de gestion complet, un
enseignant d'un formulaire de saisie ciblé sur les matières qu'il
enseigne, un étudiant d'une vue de consultation de ses propres données.

**Les fonctionnalités intermédiaires** ajoutent un espace d'annonces, à
portée globale ou restreinte à une classe précise, ainsi qu'un système
de réservation de ressources partagées (salles, matériel). Cette
dernière fonctionnalité comporte la seule véritable logique
algorithmique non triviale du projet : la détection automatique de
chevauchement entre deux créneaux horaires sur une même ressource,
condition mathématique classique (`début_A < fin_B ET fin_A > début_B`)
qui a fait l'objet d'une attention particulière lors des tests (voir
4.5).

**Les fonctionnalités complémentaires** ont été réalisées en fin de
projet, une fois le socle stabilisé et testé. Elles comprennent :

- **Un système de notifications internes** : lorsqu'un enseignant saisit
  une absence ou une note, ou qu'une annonce est publiée, les étudiants
  concernés reçoivent une notification, consultable via une cloche
  affichée dans l'en-tête avec un compteur de notifications non lues,
  rafraîchi automatiquement toutes les trente secondes. Le choix de
  notifications internes plutôt que d'e-mails réels est un compromis
  assumé : l'envoi de courriers électroniques aurait imposé le recours à
  un service tiers et à sa configuration, pour un bénéfice pédagogique
  limité par rapport à la complexité ajoutée.
- **Un tableau de bord statistique pour l'administrateur**, présentant
  les chiffres clés de l'établissement, le niveau d'absentéisme et la
  moyenne de chaque classe et de chaque matière. Les notes y sont
  ramenées sur 20 avant d'être moyennées, afin de pouvoir comparer des
  évaluations de barèmes différents, et l'absentéisme est exprimé en
  nombre d'absences *par étudiant* plutôt qu'en total brut, pour que des
  classes d'effectifs différents restent comparables.
- **Un export PDF du bulletin de notes**, généré côté serveur après
  vérification des droits d'accès : un étudiant ne peut télécharger que
  son propre bulletin, un enseignant celui des étudiants des classes où
  il enseigne, et un administrateur n'importe lequel. Le rendu du
  document a été contrôlé visuellement, ce qui a permis de détecter et de
  corriger un défaut de mise en page (page vierge parasite) que les tests
  automatisés ne pouvaient pas révéler.

*[Insérez ici 2 à 4 captures d'écran représentatives de l'application :
le tableau de bord de chaque rôle, le formulaire de réservation avec un
conflit détecté, par exemple.]*

## 4.4 Difficultés techniques rencontrées et solutions apportées

Plusieurs difficultés, de nature technique et méthodologique, ont ponctué
le développement et ont chacune donné lieu à un apprentissage concret :

**Différences d'environnement entre outils de développement.**
Développant sous Windows, plusieurs commandes issues de la documentation
ou d'habitudes Unix/Linux (`cp` pour copier un fichier, par exemple) se
sont révélées non reconnues par l'invite de commandes Windows,
nécessitant l'usage des équivalents natifs (`copy`, `xcopy`). Cette
difficulté, mineure mais récurrente en début de projet, a été l'occasion
de mieux comprendre les différences entre shells (Bash, PowerShell,
invite de commandes) et leurs implications pratiques.

**Erreur de modélisation lors de l'extension du schéma de données.**
Lors de l'ajout des modèles liés aux annonces et aux réservations, une
modification imprécise du fichier de schéma Prisma a provoqué la
suppression accidentelle d'un modèle existant (`Grade`). Cette erreur a
été détectée par une relecture systématique du fichier de schéma avant
toute exécution de migration — une pratique de vérification qui a été
conservée pour la suite du projet.

**Conflits de port lors du redémarrage du serveur.** Une erreur
`EADDRINUSE` (port déjà utilisé) est survenue à plusieurs reprises lors
de la reprise du développement après une pause, un ancien processus
serveur étant resté actif dans un terminal oublié. Cette expérience a
souligné l'importance de vérifier systématiquement l'état des processus
en cours avant de relancer un service, notamment dans un contexte de
développement solo où aucun collègue n'est présent pour signaler
l'incohérence.

[Ajoutez ici toute autre difficulté que vous jugez pertinente de
mentionner — notamment tout ce que vous avez vécu comme réellement
difficile intellectuellement, pas seulement les problèmes d'outillage.
Le jury s'intéresse autant à votre capacité de raisonnement qu'à votre
capacité à suivre une procédure.]

## 4.5 Tests automatisés

Une suite de tests automatisés a été développée avec **Jest** et
**Supertest**, ciblant les zones du projet jugées les plus critiques ou
les plus susceptibles de contenir des erreurs subtiles :

1. **L'authentification** : création de compte avec des données valides
   et invalides, tentative de connexion avec de bons et de mauvais
   identifiants, et vérification explicite que le rôle envoyé par le
   client à l'inscription est bien ignoré par le serveur.
2. **Le contrôle d'accès par rôle** : vérification des trois issues
   possibles d'une requête vers une route protégée (absence de token,
   token valide mais rôle insuffisant, rôle autorisé).
3. **La détection de conflits de réservation** : test de plusieurs cas de
   chevauchement (total, partiel, créneaux strictement adjacents sans
   chevauchement), ce dernier cas étant le plus susceptible de révéler
   une erreur d'implémentation (utilisation d'une comparaison stricte
   `<` au lieu d'une comparaison large `<=`, ou inversement).

Cette suite de tests s'exécute contre la base de données de
développement réelle, les données créées par les tests étant supprimées
automatiquement à la fin de leur exécution. Ce choix, pragmatique dans le
cadre d'un projet solo à temps limité, constitue une limite assumée par
rapport à la pratique professionnelle recommandée, qui consisterait à
exécuter les tests contre une base de données entièrement isolée de
l'environnement de développement. Cette limite est explicitement
documentée comme axe d'amélioration (voir partie Bilan et perspectives).

---

## Note pour la suite de la rédaction

- Les paragraphes de cette section sont denses : n'hésitez pas à les
  aérer avec des captures d'écran ou des extraits de code courts et
  commentés une fois mis en page dans votre traitement de texte final.
- Complétez les crochets `[...]` avec vos éléments personnels (lien
  GitHub, fonctionnalités bonus réalisées, captures d'écran, difficultés
  supplémentaires vécues).
- Si vous avez développé une fonctionnalité bonus (notifications, export
  PDF, statistiques) d'ici la fin du projet, dites-le-moi : je rédigerai
  le paragraphe correspondant à intégrer dans le 4.3.
