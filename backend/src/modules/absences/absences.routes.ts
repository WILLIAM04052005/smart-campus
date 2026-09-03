import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";
import { teacherOwnsSubject } from "../../utils/permissions";

const router = Router();

const absenceSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  date: z.coerce.date(),
  justified: z.boolean().optional(),
  comment: z.string().optional(),
});

// GET /api/absences — la liste retournée dépend du rôle :
// - STUDENT  : uniquement ses propres absences
// - TEACHER  : uniquement les absences des matières qu'il enseigne
// - ADMIN    : tout, avec filtres optionnels (?studentId=, ?subjectId=)
router.get("/", authenticate, async (req, res) => {
  const { role, userId } = req.user!;
  const { studentId, subjectId } = req.query;

  let where: Record<string, unknown> = {};

  if (role === "STUDENT") {
    where.studentId = userId;
  } else if (role === "TEACHER") {
    where.subject = { teacherId: userId };
  } else {
    // ADMIN : filtres libres
    if (studentId) where.studentId = String(studentId);
    if (subjectId) where.subjectId = String(subjectId);
  }

  const absences = await prisma.absence.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  res.json({ absences });
});

// POST /api/absences — création (enseignant de la matière, ou admin)
router.post("/", authenticate, authorize("TEACHER", "ADMIN"), async (req, res) => {
  const parsed = absenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { role, userId } = req.user!;

  // Un enseignant ne peut saisir une absence QUE pour une matière qu'il
  // enseigne (voir utils/permissions.ts). Un admin peut tout faire.
  if (role === "TEACHER" && !(await teacherOwnsSubject(userId, parsed.data.subjectId))) {
    return res.status(403).json({ message: "Vous n'enseignez pas cette matière." });
  }

  const absence = await prisma.absence.create({ data: parsed.data });
  res.status(201).json({ absence });
});

// PATCH /api/absences/:id — typiquement pour justifier une absence
router.patch("/:id", authenticate, authorize("TEACHER", "ADMIN"), async (req, res) => {
  const parsed = z.object({ justified: z.boolean(), comment: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides" });
  }

  const absence = await prisma.absence.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ absence });
});

router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  await prisma.absence.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
