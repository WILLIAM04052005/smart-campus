import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

const classSchema = z.object({
  name: z.string().min(1, "Le nom de la classe est requis."),
  year: z.number().int().min(2000).max(2100),
});

// GET /api/classes — accessible à tout utilisateur connecté (utile pour
// remplir des menus déroulants côté frontend, ex: choisir sa classe).
router.get("/", authenticate, async (_req, res) => {
  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { students: true } } },
  });
  res.json({ classes });
});

// GET /api/classes/:id — détail d'une classe avec ses étudiants
router.get("/:id", authenticate, async (req, res) => {
  const classItem = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: {
      students: { select: { id: true, firstName: true, lastName: true, email: true } },
      subjects: true,
    },
  });

  if (!classItem) return res.status(404).json({ message: "Classe introuvable." });
  res.json({ class: classItem });
});

// POST /api/classes — création (admin uniquement)
router.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = classSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const newClass = await prisma.class.create({ data: parsed.data });
  res.status(201).json({ class: newClass });
});

// PUT /api/classes/:id — modification (admin uniquement)
router.put("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = classSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const updated = await prisma.class.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ class: updated });
});

// DELETE /api/classes/:id — suppression (admin uniquement)
// Attention : supprime aussi en cascade les matières et l'emploi du temps
// liés (voir onDelete: Cascade dans schema.prisma).
router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  await prisma.class.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
