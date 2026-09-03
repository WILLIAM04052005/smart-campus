import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // format "HH:mm"

const scheduleSchema = z.object({
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(timeRegex, "Format attendu : HH:mm"),
  endTime: z.string().regex(timeRegex, "Format attendu : HH:mm"),
  room: z.string().min(1),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

// GET /api/schedule?classId=... — emploi du temps d'une classe.
// Accessible à tout utilisateur connecté : un étudiant consulte celui de
// sa propre classe, un admin peut consulter n'importe laquelle.
router.get("/", authenticate, async (req, res) => {
  const { classId } = req.query;

  if (!classId) {
    return res.status(400).json({ message: "Le paramètre classId est requis." });
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: { classId: String(classId) },
    include: { subject: { select: { id: true, name: true, teacher: { select: { firstName: true, lastName: true } } } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  res.json({ entries });
});

router.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  if (parsed.data.startTime >= parsed.data.endTime) {
    return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début." });
  }

  const entry = await prisma.scheduleEntry.create({ data: parsed.data });
  res.status(201).json({ entry });
});

router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  await prisma.scheduleEntry.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
