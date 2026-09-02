import express from "express";
import cors from "cors";
import { prisma } from "./config/db";

const app = express();

app.use(cors());
app.use(express.json());

// --------------------------------------------------------------
// Route de santé : vérifie que l'API tourne ET que la connexion
// à la base de données fonctionne. Très utile pour valider le
// Sprint 0 avant d'ajouter la moindre fonctionnalité métier.
// --------------------------------------------------------------
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

// Les routes métier (auth, users, classes, ...) seront ajoutées
// ici au fil des prochains sprints, par exemple :
// app.use("/api/auth", authRouter);
// app.use("/api/users", usersRouter);

export default app;
