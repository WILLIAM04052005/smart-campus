import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

const subjectSchema = z.object({
  name: z.string().min(1),
  classId: z.string().uuid(),
  teacherId: z.string().uuid().nullable().optional(),
});

// GET /api/subjects?classId=... — liste les matières, filtrable par classe
router.get("/", authenticate, async (req, res) => {
  const { classId } = req.query;

  const subjects = await prisma.subject.findMany({
    where: classId ? { classId: String(classId) } : undefined,
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      class: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  res.json({ subjects });
});

router.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const subject = await prisma.subject.create({ data: parsed.data });
  res.status(201).json({ subject });
});

router.put("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = subjectSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const subject = await prisma.subject.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ subject });
});

router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  await prisma.subject.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
