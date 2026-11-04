import { prisma } from "../config/db";
import { NotificationType } from "@prisma/client";

export async function notifyUser(userId: string, message: string, type: NotificationType) {
  await prisma.notification.create({ data: { userId, message, type } });
}

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

export async function notifyAllStudents(message: string, type: NotificationType) {
  const students = await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true } });
  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({ userId: s.id, message, type })),
  });
}
