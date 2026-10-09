import { Router } from "express";
import { prisma } from "../../config/db";
import { authenticate } from "../../middleware/auth";

const router = Router();

// GET /api/notifications — les notifications de l'utilisateur connecté
// uniquement (jamais celles d'un autre utilisateur).
router.get("/", authenticate, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    take: 30, // on limite le volume renvoyé, un historique complet n'a pas d'intérêt ici
  });

  res.json({ notifications });
});

// PATCH /api/notifications/:id — marquer une notification comme lue.
// On vérifie que la notification appartient bien à l'utilisateur
// connecté avant de la modifier.
router.patch("/:id", authenticate, async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });

  if (!notification || notification.userId !== req.user!.userId) {
    return res.status(404).json({ message: "Notification introuvable." });
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });

  res.json({ notification: updated });
});

// PATCH /api/notifications/read-all — marquer toutes les notifications
// de l'utilisateur connecté comme lues en une seule requête.
router.patch("/read-all/mark", authenticate, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });

  res.status(204).send();
});

export default router;
