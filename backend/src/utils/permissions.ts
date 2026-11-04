import { prisma } from "../config/db";

export async function teacherOwnsSubject(teacherId: string, subjectId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  return subject?.teacherId === teacherId;
}

export async function teacherTeachesClass(teacherId: string, classId: string): Promise<boolean> {
  const subject = await prisma.subject.findFirst({ where: { teacherId, classId } });
  return subject !== null;
}
