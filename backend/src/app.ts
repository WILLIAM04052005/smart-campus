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
import notificationsRoutes from "./modules/notifications/notifications.routes";
import statsRoutes from "./modules/stats/stats.routes";
import bulletinsRoutes from "./modules/bulletins/bulletins.routes";
import { authenticate, authorize } from "./middleware/auth";

const app = express();

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
app.use("/api/notifications", notificationsRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/bulletins", bulletinsRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.get("/api/admin/ping", authenticate, authorize("ADMIN"), (_req, res) => {
  res.json({ message: "Bienvenue, administrateur." });
});

export default app;
