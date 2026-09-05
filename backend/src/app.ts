import express from "express";
import cors from "cors";
import { prisma } from "./config/db";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import classesRoutes from "./modules/classes/classes.routes";
import subjectsRoutes from "./modules/subjects/subjects.routes";
import scheduleRoutes from "./modules/schedule/schedule.routes";
import absencesRoutes from "./modules/absences/absences.routes";
import gradesRoutes from "./modules/grades/grades.routes";
import announcementsRoutes from "./modules/announcements/announcements.routes";
import resourcesRoutes from "./modules/resources/resources.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import { authenticate, authorize } from "./middleware/auth";

const app = express();

// En développement, on autorise toutes les origines (simple, pas de
// risque puisque rien n'est exposé publiquement). En production, la
// variable CORS_ORIGIN (définie sur Render) restreint l'accès à
// l'URL exacte du frontend déployé — évite que n'importe quel autre
// site puisse appeler notre API depuis un navigateur.
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/absences", absencesRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/bookings", bookingsRoutes);

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

// --------------------------------------------------------------
// Exemple de route protégée : démontre l'utilisation combinée de
// authenticate (token valide requis) et authorize (rôle requis).
// À supprimer/adapter une fois la vraie gestion des users construite.
// --------------------------------------------------------------
app.get("/api/admin/ping", authenticate, authorize("ADMIN"), (_req, res) => {
  res.json({ message: "Bienvenue, administrateur." });
});

export default app;
