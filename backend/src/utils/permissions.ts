import { prisma } from "../config/db";

// Utilisé par les modules absences et grades : un enseignant ne doit
// pouvoir saisir une absence/note QUE pour une matière qu'il enseigne
// réellement. Sans cette vérification, n'importe quel compte TEACHER
// pourrait modifier les notes de n'importe quelle classe.
export async function teacherOwnsSubject(teacherId: string, subjectId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  return subject?.teacherId === teacherId;
}

// Utilisé par le module annonces : un enseignant ne peut publier une
// annonce ciblée sur une classe que s'il y enseigne au moins une matière.
export async function teacherTeachesClass(teacherId: string, classId: string): Promise<boolean> {
  const subject = await prisma.subject.findFirst({ where: { teacherId, classId } });
  return subject !== null;
}
