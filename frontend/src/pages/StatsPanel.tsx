import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Stats {
  overview: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    totalAbsences: number;
    unjustifiedAbsences: number;
    totalGrades: number;
    globalAverage: number | null;
  };
  perClass: {
    classId: string;
    className: string;
    students: number;
    absences: number;
    unjustifiedAbsences: number;
    absencesPerStudent: number;
    averageGrade: number | null;
  }[];
  perSubject: {
    subjectId: string;
    subjectName: string;
    className: string;
    gradeCount: number;
    averageGrade: number | null;
  }[];
}

// Petite carte de chiffre clé
function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function StatsPanel() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Stats>("/stats", { token })
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."));
  }, []);

  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!stats) return <p className="text-slate-500 text-sm">Chargement des statistiques...</p>;

  const { overview, perClass, perSubject } = stats;
  const maxAbsencesPerStudent = Math.max(1, ...perClass.map((c) => c.absencesPerStudent));
  const absenceRate =
    overview.totalAbsences > 0
      ? Math.round((overview.unjustifiedAbsences / overview.totalAbsences) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Étudiants" value={overview.students} />
        <StatCard label="Enseignants" value={overview.teachers} />
        <StatCard label="Classes" value={overview.classes} hint={`${overview.subjects} matière(s)`} />
        <StatCard
          label="Moyenne générale"
          value={overview.globalAverage !== null ? `${overview.globalAverage}/20` : "—"}
          hint={`${overview.totalGrades} note(s)`}
        />
        <StatCard label="Absences" value={overview.totalAbsences} />
        <StatCard
          label="Non justifiées"
          value={overview.unjustifiedAbsences}
          hint={overview.totalAbsences > 0 ? `${absenceRate}% des absences` : undefined}
        />
      </section>

      <section>
        <h3 className="font-semibold mb-3">Absences par étudiant, par classe</h3>
        {perClass.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune classe pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {perClass.map((c) => (
              <li key={c.classId}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {c.className} <span className="text-slate-500">({c.students} étudiant(s))</span>
                  </span>
                  <span className="text-slate-400">
                    {c.absencesPerStudent} abs./étudiant · {c.unjustifiedAbsences} non justifiée(s)
                  </span>
                </div>
                <Bar value={c.absencesPerStudent} max={maxAbsencesPerStudent} color="bg-red-400" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-3">Moyenne par classe (/20)</h3>
        <ul className="space-y-3">
          {perClass.map((c) => (
            <li key={c.classId}>
              <div className="flex justify-between text-sm mb-1">
                <span>{c.className}</span>
                <span className="text-slate-400">{c.averageGrade !== null ? c.averageGrade : "Pas de notes"}</span>
              </div>
              <Bar value={c.averageGrade ?? 0} max={20} color="bg-emerald-400" />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Moyenne par matière (/20)</h3>
        {perSubject.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune note saisie pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {perSubject.map((s) => (
              <li key={s.subjectId}>
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {s.subjectName} <span className="text-slate-500">({s.className})</span>
                  </span>
                  <span className="text-slate-400">
                    {s.averageGrade} · {s.gradeCount} note(s)
                  </span>
                </div>
                <Bar value={s.averageGrade ?? 0} max={20} color="bg-sky-400" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
