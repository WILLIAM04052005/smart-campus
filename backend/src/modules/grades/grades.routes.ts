import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";
import { teacherOwnsSubject } from "../../utils/permissions";
import { notifyUser } from "../../utils/notify";

const router = Router();

const gradeSchema = z.object({
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  value: z.number().min(0),
  maxValue: z.number().min(1).optional(),
  comment: z.string().optional(),
});

// GET /api/grades — même logique de visibilité que les absences :
// étudiant -> les siennes, enseignant -> ses matières, admin -> tout.
router.get("/", authenticate, async (req, res) => {
  const { role, userId } = req.user!;
  const { studentId, subjectId } = req.query;

  let where: Record<string, unknown> = {};

  if (role === "STUDENT") {
    where.studentId = userId;
  } else if (role === "TEACHER") {
    where.subject = { teacherId: userId };
  } else {
    if (studentId) where.studentId = String(studentId);
    if (subjectId) where.subjectId = String(subjectId);
  }

  const grades = await prisma.grade.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  res.json({ grades });
});

router.post("/", authenticate, authorize("TEACHER", "ADMIN"), async (req, res) => {
  const parsed = gradeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { role, userId } = req.user!;

  if (role === "TEACHER" && !(await teacherOwnsSubject(userId, parsed.data.subjectId))) {
    return res.status(403).json({ message: "Vous n'enseignez pas cette matière." });
  }

  if (parsed.data.value > (parsed.data.maxValue ?? 20)) {
    return res.status(400).json({ message: "La note ne peut pas dépasser le barème." });
  }

  const grade = await prisma.grade.create({
    data: parsed.data,
    include: { subject: { select: { name: true } } },
  });

  await notifyUser(
    parsed.data.studentId,
    `Nouvelle note en ${grade.subject.name} : ${parsed.data.value}/${parsed.data.maxValue ?? 20}.`,
    "GRADE"
  );

  res.status(201).json({ grade });
});

router.delete("/:id", authenticate, authorize("ADMIN", "TEACHER"), async (req, res) => {
  await prisma.grade.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
