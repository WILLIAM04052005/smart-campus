# 2. Contexte et analyse des besoins

*(Section rédigée, prête à être intégrée au rapport. Les passages entre
crochets [ainsi] sont des indications à personnaliser ou à vérifier —
supprimez les crochets une fois adaptés.)*

## 2.1 Contexte

Le projet Smart Campus a été pensé pour répondre à une problématique
courante dans les établissements de formation de taille moyenne : la
gestion de la vie académique repose encore fréquemment sur une multitude
d'outils disparates et non connectés entre eux — tableurs Excel pour les
emplois du temps, échanges par e-mail pour les annonces, formulaires
papier ou registres manuels pour les absences, feuilles de notes
distribuées individuellement par chaque enseignant.

Pour donner un cadre concret à ce projet, j'ai choisi de me placer dans
le contexte fictif de **NextCampus**, un centre de formation informatique
d'environ 350 étudiants répartis sur 5 filières. Cette taille
d'établissement est représentative d'un grand nombre de structures de
formation en France : suffisamment importante pour que la coordination
manuelle entre les équipes pédagogiques et administratives devienne
source d'erreurs et de perte de temps, mais trop restreinte pour
justifier l'achat d'une solution de gestion académique "clé en main",
souvent coûteuse et surdimensionnée par rapport aux besoins réels.

La problématique à laquelle Smart Campus tente de répondre peut se
formuler ainsi : **comment centraliser la gestion de la vie académique
d'un établissement — emploi du temps, notes, absences, communication et
réservation de ressources — au sein d'une plateforme unique, tout en
adaptant l'information et les actions disponibles au rôle de chaque
utilisateur ?**

## 2.2 Recueil et analyse des besoins

En l'absence d'un commanditaire réel, le recueil des besoins s'est appuyé
sur une démarche de mise en situation : pour chacun des trois profils
d'utilisateurs identifiés, j'ai listé les tâches qu'il doit pouvoir
accomplir au quotidien sur la plateforme, en me demandant systématiquement
ce qui, dans une gestion "à l'ancienne" (Excel, e-mail, papier), pose le
plus de difficultés à ce profil.

**L'étudiant** a avant tout besoin de **consulter** de l'information qui
le concerne directement : son emploi du temps de la semaine, ses notes au
fur et à mesure qu'elles sont saisies, la liste de ses absences (avec leur
statut justifié ou non), ainsi que les annonces qui le concernent. Il a
également besoin de pouvoir agir sur la plateforme, en particulier pour
réserver une ressource partagée (salle de travail, matériel) sans avoir à
solliciter un tiers.

**L'enseignant** a des besoins centrés sur la **saisie** d'information :
enregistrer une absence ou une note pour un étudiant de ses classes,
publier une annonce à destination d'une classe précise. Il a également
besoin de consulter son propre planning et la liste des étudiants qui
lui sont rattachés (via les matières qu'il enseigne).

**L'administrateur** a des besoins de **supervision et de configuration**
globale : créer les classes et les matières, affecter les étudiants à
leur classe, désigner les enseignants responsables de chaque matière,
construire l'emploi du temps, et disposer d'une vision d'ensemble sur les
utilisateurs et les ressources de l'établissement. C'est également lui
qui détient le pouvoir exclusif de faire évoluer le rôle d'un compte
(promouvoir un utilisateur en enseignant ou en administrateur) — un choix
de sécurité détaillé dans la partie Réalisation de ce rapport.

Ce travail de recueil a permis de dégager une règle transversale
importante, qui a orienté plusieurs choix de conception ultérieurs :
**la visibilité et les droits d'action d'un utilisateur dépendent
entièrement de son rôle**. Ce principe — connu sous le nom de contrôle
d'accès basé sur les rôles (RBAC, *Role-Based Access Control*) — est
devenu un fil conducteur de toute l'architecture applicative du projet.

## 2.3 Périmètre fonctionnel retenu

Face à l'ampleur du besoin exprimé et au temps disponible pour un projet
mené en solo sur l'année, il était nécessaire de prioriser les
fonctionnalités plutôt que de toutes les développer avec la même
profondeur dès le départ. J'ai retenu une approche par paliers, inspirée
des méthodes de développement itératif (type MVP — *Minimum Viable
Product*) :

- Un **socle fonctionnel minimal (MVP)** regroupant l'authentification,
  la gestion des utilisateurs et des classes, l'emploi du temps, les
  absences et les notes — c'est-à-dire l'ensemble minimal permettant de
  démontrer une gestion académique de bout en bout pour les trois profils
  d'utilisateurs.
- Des **fonctionnalités intermédiaires**, ajoutées une fois le socle
  stabilisé : les annonces (avec une portée globale ou ciblée sur une
  classe) et la réservation de ressources partagées, avec une gestion
  automatique des conflits de créneaux.
- Des **fonctionnalités bonus**, envisagées si le temps le permettait en
  fin de projet : notifications, export PDF des bulletins, tableau de
  bord statistique.

Ce choix de priorisation répond directement à l'un des objectifs de cette
épreuve, qui est d'évaluer la capacité à proposer des solutions
"réalisables" : plutôt que de viser un périmètre fonctionnel trop large
au risque de livrer un ensemble de fonctionnalités inachevées, j'ai
préféré garantir un socle solide, testé et démontrable, quitte à
documenter clairement les fonctionnalités non retenues comme perspectives
d'évolution (voir la partie Bilan et perspectives de ce rapport).

---

## Note pour la suite de la rédaction

Ce texte reprend la structure et les décisions déjà actées dans le
cahier des charges du projet. Pour vous l'approprier pleinement avant de
le remettre dans votre rapport final, je vous suggère de :

1. Relire chaque paragraphe et vérifier qu'il correspond bien à ce que
   *vous* avez pensé et décidé — reformulez ce qui ne "sonne" pas comme
   vous.
2. Ajouter, si vous le souhaitez, un exemple concret personnel (un
   souvenir d'organisation scolaire chaotique vécu, une anecdote) en
   introduction du 2.1 — les jurys apprécient un contexte qui a une
   coloration personnelle plutôt que purement théorique.
3. Vérifier la cohérence des chiffres (350 étudiants, 5 filières) avec ce
   que vous avez éventuellement présenté à l'oral ou dans d'autres
   documents de votre formation.
