import { prisma } from "../config/db";

// Utilisé par les modules absences et grades : un enseignant ne doit
// pouvoir saisir une absence/note QUE pour une matière qu'il enseigne
// réellement. Sans cette vérification, n'importe quel compte TEACHER
// pourrait modifier les notes de n'importe quelle classe.
export async function teacherOwnsSubject(teacherId: string, subjectId: string): Promise<boolean> {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  return subject?.teacherId === teacherId;
}
