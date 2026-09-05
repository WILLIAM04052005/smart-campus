import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";
import { teacherTeachesClass } from "../../utils/permissions";

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  classId: z.string().uuid().nullable().optional(), // null/absent = annonce globale
});

// GET /api/announcements — la visibilité dépend du rôle :
// - STUDENT  : annonces globales + celles de sa propre classe
// - TEACHER  : annonces globales + celles des classes où il enseigne
// - ADMIN    : tout
router.get("/", authenticate, async (req, res) => {
  const { role, userId } = req.user!;

  let where: Record<string, unknown> = {};

  if (role === "STUDENT") {
    const student = await prisma.user.findUnique({ where: { id: userId } });
    where = { OR: [{ classId: null }, { classId: student?.classId ?? "__none__" }] };
  } else if (role === "TEACHER") {
    const taughtClassIds = await prisma.subject.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    });
    const ids = taughtClassIds.map((s) => s.classId);
    where = { OR: [{ classId: null }, { classId: { in: ids } }] };
  }
  // ADMIN : pas de filtre, tout est visible

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      author: { select: { firstName: true, lastName: true, role: true } },
      class: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ announcements });
});

// POST /api/announcements — un enseignant ne peut cibler qu'une classe où
// il enseigne (ou publier en global) ; un admin peut tout faire.
router.post("/", authenticate, authorize("TEACHER", "ADMIN"), async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { role, userId } = req.user!;
  const { classId } = parsed.data;

  if (role === "TEACHER" && classId && !(await teacherTeachesClass(userId, classId))) {
    return res.status(403).json({ message: "Vous n'enseignez pas dans cette classe." });
  }

  const announcement = await prisma.announcement.create({
    data: { ...parsed.data, authorId: userId },
  });

  res.status(201).json({ announcement });
});

router.delete("/:id", authenticate, authorize("TEACHER", "ADMIN"), async (req, res) => {
  const { role, userId } = req.user!;
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });

  if (!announcement) return res.status(404).json({ message: "Annonce introuvable." });

  // Un enseignant ne peut supprimer que ses propres annonces ; un admin, toutes.
  if (role === "TEACHER" && announcement.authorId !== userId) {
    return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres annonces." });
  }

  await prisma.announcement.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
