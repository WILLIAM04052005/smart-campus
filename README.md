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

## Prochaines étapes (Sprint 1)

- [ ] Ajouter le modèle `User` complet (déjà fait dans `schema.prisma`)
- [ ] Créer les routes `/api/auth/register` et `/api/auth/login`
- [ ] Hasher les mots de passe avec `bcrypt`
- [ ] Générer et vérifier des tokens JWT
- [ ] Créer un middleware de protection des routes par rôle
- [ ] Créer les pages Login/Register côté frontend

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
