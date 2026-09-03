import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

const SAFE_FIELDS = { id: true, email: true, firstName: true, lastName: true, role: true, classId: true } as const;

// GET /api/users — liste tous les utilisateurs (admin uniquement).
// Sert notamment à l'admin pour choisir un enseignant à assigner à une
// matière, ou pour affecter un étudiant à une classe.
router.get("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const { role } = req.query;

  const users = await prisma.user.findMany({
    where: role ? { role: role as Role } : undefined,
    select: SAFE_FIELDS,
    orderBy: { lastName: "asc" },
  });

  res.json({ users });
});

const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  classId: z.string().uuid().nullable().optional(),
});

// PATCH /api/users/:id — modifie le rôle et/ou la classe d'un utilisateur.
// C'est ICI, et seulement ici, qu'un utilisateur peut devenir TEACHER ou
// ADMIN — jamais via la route d'inscription publique (voir Sprint 1).
router.patch("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: SAFE_FIELDS,
  });

  res.json({ user: updated });
});

export default router;
