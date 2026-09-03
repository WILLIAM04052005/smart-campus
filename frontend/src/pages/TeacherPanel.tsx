import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Subject {
  id: string;
  name: string;
  classId: string;
  teacher: { id: string } | null;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export default function TeacherPanel() {
  const { user, token } = useAuth();
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [absenceDate, setAbsenceDate] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Charger uniquement les matières que CET enseignant enseigne
  useEffect(() => {
    apiRequest<{ subjects: Subject[] }>("/subjects", { token }).then((res) => {
      setMySubjects(res.subjects.filter((s) => s.teacher?.id === user?.id));
    });
  }, []);

  // Quand une matière est sélectionnée, charger les étudiants de sa classe
  useEffect(() => {
    const subject = mySubjects.find((s) => s.id === selectedSubjectId);
    if (!subject) {
      setStudents([]);
      return;
    }
    apiRequest<{ class: { students: Student[] } }>(`/classes/${subject.classId}`, { token }).then((res) =>
      setStudents(res.class.students)
    );
  }, [selectedSubjectId]);

  async function submitAbsence(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await apiRequest("/absences", {
        method: "POST",
        token,
        body: { studentId: selectedStudentId, subjectId: selectedSubjectId, date: absenceDate },
      });
      setFeedback("Absence enregistrée.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur.");
    }
  }

  async function submitGrade(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await apiRequest("/grades", {
        method: "POST",
        token,
        body: { studentId: selectedStudentId, subjectId: selectedSubjectId, value: Number(gradeValue) },
      });
      setFeedback("Note enregistrée.");
      setGradeValue("");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Erreur.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-slate-100">
      <h2 className="text-2xl font-bold mb-4">Espace enseignant</h2>

      <label className="flex flex-col gap-1 text-sm mb-6">
        Matière
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
        >
          <option value="">Choisissez une matière...</option>
          {mySubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </label>

      {selectedSubjectId && (
        <>
          <label className="flex flex-col gap-1 text-sm mb-4">
            Étudiant
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="">Choisissez un étudiant...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </label>

          {feedback && <p className="text-emerald-400 text-sm mb-4">{feedback}</p>}

          <div className="grid grid-cols-2 gap-4">
            <form onSubmit={submitAbsence} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
              <h3 className="font-semibold">Signaler une absence</h3>
              <input
                type="date"
                required
                value={absenceDate}
                onChange={(e) => setAbsenceDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              />
              <button
                disabled={!selectedStudentId}
                className="bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm"
              >
                Enregistrer l'absence
              </button>
            </form>

            <form onSubmit={submitGrade} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
              <h3 className="font-semibold">Saisir une note (/20)</h3>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                required
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              />
              <button
                disabled={!selectedStudentId}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-900 font-semibold rounded-lg py-2 text-sm"
              >
                Enregistrer la note
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
