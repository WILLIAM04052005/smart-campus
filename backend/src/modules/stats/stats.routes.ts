import { Router } from "express";
import { prisma } from "../../config/db";
import { authenticate, authorize } from "../../middleware/auth";

const router = Router();

// Arrondi à une décimale, pour un affichage lisible côté frontend.
const round1 = (n: number) => Math.round(n * 10) / 10;

// GET /api/stats — vue d'ensemble de l'établissement (ADMIN uniquement).
//
// Les agrégations sont calculées en JavaScript à partir de requêtes
// simples plutôt qu'avec du SQL brut : à l'échelle d'un établissement de
// quelques centaines d'étudiants, la différence de performance est
// négligeable, et le code reste lisible et typé.
router.get("/", authenticate, authorize("ADMIN"), async (_req, res) => {
  const [studentCount, teacherCount, classes, absences, grades, subjects] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.class.findMany({
      select: { id: true, name: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.absence.findMany({
      select: { justified: true, student: { select: { classId: true } } },
    }),
    prisma.grade.findMany({
      select: {
        value: true,
        maxValue: true,
        subjectId: true,
        student: { select: { classId: true } },
      },
    }),
    prisma.subject.findMany({ select: { id: true, name: true, class: { select: { name: true } } } }),
  ]);

  // Une note est ramenée sur 20 pour pouvoir comparer des barèmes différents.
  const normalize = (g: { value: number; maxValue: number }) => (g.value / g.maxValue) * 20;

  // --- Statistiques par classe ---------------------------------------
  const perClass = classes.map((c) => {
    const classAbsences = absences.filter((a) => a.student.classId === c.id);
    const classGrades = grades.filter((g) => g.student.classId === c.id);
    const studentsInClass = c._count.students;

    return {
      classId: c.id,
      className: c.name,
      students: studentsInClass,
      absences: classAbsences.length,
      unjustifiedAbsences: classAbsences.filter((a) => !a.justified).length,
      // Moyenne d'absences par étudiant : plus parlante qu'un total brut
      // pour comparer des classes d'effectifs différents.
      absencesPerStudent: studentsInClass > 0 ? round1(classAbsences.length / studentsInClass) : 0,
      averageGrade:
        classGrades.length > 0
          ? round1(classGrades.reduce((sum, g) => sum + normalize(g), 0) / classGrades.length)
          : null,
    };
  });

  // --- Statistiques par matière --------------------------------------
  const perSubject = subjects
    .map((s) => {
      const subjectGrades = grades.filter((g) => g.subjectId === s.id);
      return {
        subjectId: s.id,
        subjectName: s.name,
        className: s.class.name,
        gradeCount: subjectGrades.length,
        averageGrade:
          subjectGrades.length > 0
            ? round1(subjectGrades.reduce((sum, g) => sum + normalize(g), 0) / subjectGrades.length)
            : null,
      };
    })
    .filter((s) => s.gradeCount > 0); // on n'affiche que les matières notées

  res.json({
    overview: {
      students: studentCount,
      teachers: teacherCount,
      classes: classes.length,
      subjects: subjects.length,
      totalAbsences: absences.length,
      unjustifiedAbsences: absences.filter((a) => !a.justified).length,
      totalGrades: grades.length,
      globalAverage:
        grades.length > 0 ? round1(grades.reduce((sum, g) => sum + normalize(g), 0) / grades.length) : null,
    },
    perClass,
    perSubject,
  });
});

export default router;
