import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ROOM", "EQUIPMENT"]),
  capacity: z.number().int().positive().optional(),
});

// GET /api/resources — accessible à tous les utilisateurs connectés
// (il faut bien pouvoir voir ce qui existe pour le réserver).
router.get("/", authenticate, async (_req, res) => {
  const resources = await prisma.resource.findMany({ orderBy: { name: "asc" } });
  res.json({ resources });
});

router.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const resource = await prisma.resource.create({ data: parsed.data });
  res.status(201).json({ resource });
});

router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  await prisma.resource.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
