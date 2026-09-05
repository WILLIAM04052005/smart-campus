import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/db";
import { authenticate } from "../../middleware/auth";

const router = Router();

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const bookingSchema = z.object({
  resourceId: z.string().uuid(),
  date: z.coerce.date(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  purpose: z.string().optional(),
});

// Deux créneaux se chevauchent si l'un commence avant que l'autre ne se
// termine, ET se termine après que l'autre ait commencé. C'est la
// condition mathématique classique de chevauchement d'intervalles.
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// GET /api/bookings?resourceId=&date= — consulter les réservations d'une
// ressource à une date donnée (pour visualiser les créneaux déjà pris).
router.get("/", authenticate, async (req, res) => {
  const { resourceId, date } = req.query;

  const where: Record<string, unknown> = {};
  if (resourceId) where.resourceId = String(resourceId);
  if (date) where.date = new Date(String(date));

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      resource: { select: { name: true, type: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startTime: "asc" },
  });

  res.json({ bookings });
});

// POST /api/bookings — n'importe quel utilisateur connecté peut réserver,
// à condition que le créneau soit libre sur cette ressource.
router.post("/", authenticate, async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { resourceId, date, startTime, endTime, purpose } = parsed.data;

  if (startTime >= endTime) {
    return res.status(400).json({ message: "L'heure de fin doit être après l'heure de début." });
  }

  // On récupère les réservations existantes pour cette ressource, ce jour,
  // et on vérifie qu'aucune ne chevauche le créneau demandé.
  const existingBookings = await prisma.booking.findMany({
    where: { resourceId, date },
  });

  const hasConflict = existingBookings.some((b) => overlaps(startTime, endTime, b.startTime, b.endTime));

  if (hasConflict) {
    return res.status(409).json({ message: "Ce créneau est déjà réservé sur cette ressource." });
  }

  const booking = await prisma.booking.create({
    data: { resourceId, date, startTime, endTime, purpose, userId: req.user!.userId },
  });

  res.status(201).json({ booking });
});

// DELETE /api/bookings/:id — annuler sa propre réservation (ou, pour un
// admin, n'importe laquelle).
router.delete("/:id", authenticate, async (req, res) => {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ message: "Réservation introuvable." });

  const { role, userId } = req.user!;
  if (role !== "ADMIN" && booking.userId !== userId) {
    return res.status(403).json({ message: "Vous ne pouvez annuler que vos propres réservations." });
  }

  await prisma.booking.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
