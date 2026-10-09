import { prisma } from "../config/db";
import { NotificationType } from "@prisma/client";

// Crée une notification pour un seul utilisateur (ex : une absence ou
// une note qui vient d'être saisie pour un étudiant précis).
export async function notifyUser(userId: string, message: string, type: NotificationType) {
  await prisma.notification.create({ data: { userId, message, type } });
}

// Crée une notification pour tous les étudiants d'une classe (ex : une
// annonce ciblée sur cette classe). Utilise createMany pour insérer en
// une seule requête plutôt qu'une boucle de créations individuelles.
export async function notifyClass(classId: string, message: string, type: NotificationType) {
  const students = await prisma.user.findMany({
    where: { classId, role: "STUDENT" },
    select: { id: true },
  });

  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({ userId: s.id, message, type })),
  });
}

// Crée une notification pour TOUS les étudiants de l'établissement
// (ex : une annonce globale).
export async function notifyAllStudents(message: string, type: NotificationType) {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({ userId: s.id, message, type })),
  });
}
