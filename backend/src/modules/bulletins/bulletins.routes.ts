import { Router } from "express";
import { prisma } from "../../config/db";
import { authenticate } from "../../middleware/auth";
import { teacherTeachesClass } from "../../utils/permissions";
import { createBulletinPdf, BulletinData } from "./bulletin.pdf";

const router = Router();

// Une note est ramenée sur 20 pour pouvoir moyenner des barèmes différents.
const normalize = (g: { value: number; maxValue: number }) => (g.value / g.maxValue) * 20;
const average = (values: number[]) =>
  values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

// GET /api/bulletins/:studentId — télécharge le bulletin PDF d'un étudiant.
// Qui peut télécharger quoi :
// - STUDENT : uniquement son propre bulletin
// - TEACHER : le bulletin des étudiants d'une classe où il enseigne
// - ADMIN   : n'importe quel bulletin
router.get("/:studentId", authenticate, async (req, res) => {
  const { role, userId } = req.user!;
  const { studentId } = req.params;

  // Contrôle le plus restrictif en premier, avant même d'interroger la
  // base : un étudiant qui vise l'identifiant d'un autre est refusé sans
  // que l'on révèle si cet identifiant existe.
  if (role === "STUDENT" && userId !== studentId) {
    return res.status(403).json({ message: "Vous ne pouvez télécharger que votre propre bulletin." });
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: { class: { select: { name: true } } },
  });

  if (!student || student.role !== "STUDENT") {
    return res.status(404).json({ message: "Étudiant introuvable." });
  }

  if (role === "TEACHER") {
    const allowed = student.classId ? await teacherTeachesClass(userId, student.classId) : false;
    if (!allowed) {
      return res.status(403).json({ message: "Vous n'enseignez pas dans la classe de cet étudiant." });
    }
  }

  const [grades, absences, classSubjects] = await Promise.all([
    prisma.grade.findMany({
      where: { studentId },
      select: { value: true, maxValue: true, subjectId: true },
      orderBy: { date: "asc" },
    }),
    prisma.absence.findMany({ where: { studentId }, select: { justified: true } }),
    // Toutes les matières de la classe, même sans note : le bulletin doit
    // montrer qu'une matière existe mais n'a pas encore été notée.
    student.classId
      ? prisma.subject.findMany({
          where: { classId: student.classId },
          select: { id: true, name: true, teacher: { select: { firstName: true, lastName: true } } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const subjects: BulletinData["subjects"] = classSubjects.map((s) => {
    const subjectGrades = grades.filter((g) => g.subjectId === s.id);
    return {
      name: s.name,
      teacherName: s.teacher ? `${s.teacher.firstName} ${s.teacher.lastName}` : null,
      grades: subjectGrades.map((g) => ({ value: g.value, maxValue: g.maxValue })),
      average: average(subjectGrades.map(normalize)),
    };
  });

  // Moyenne générale = moyenne des moyennes de matières (chaque matière
  // compte pour un, quel que soit son nombre de notes), sans les matières
  // non encore notées.
  const gradedAverages = subjects.map((s) => s.average).filter((a): a is number => a !== null);

  const data: BulletinData = {
    student: { firstName: student.firstName, lastName: student.lastName, email: student.email },
    className: student.class?.name ?? null,
    generatedAt: new Date(),
    subjects,
    generalAverage: average(gradedAverages),
    absences: { total: absences.length, unjustified: absences.filter((a) => !a.justified).length },
  };

  // Nom de fichier sûr : on retire accents et caractères spéciaux pour
  // éviter tout problème dans l'en-tête HTTP Content-Disposition.
  const safeName = `${student.lastName}-${student.firstName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "_");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="bulletin-${safeName}.pdf"`);

  const doc = createBulletinPdf(data);
  doc.pipe(res);
  doc.end();
});

export default router;
