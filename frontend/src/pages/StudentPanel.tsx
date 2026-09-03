import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface ScheduleEntry {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  subject: { name: string; teacher: { firstName: string; lastName: string } | null };
}

interface Absence {
  id: string;
  date: string;
  justified: boolean;
  subject: { name: string };
}

interface Grade {
  id: string;
  value: number;
  maxValue: number;
  date: string;
  subject: { name: string };
}

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
};

export default function StudentPanel() {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    if (!user?.classId) return;

    apiRequest<{ entries: ScheduleEntry[] }>(`/schedule?classId=${user.classId}`, { token }).then((res) =>
      setSchedule(res.entries)
    );
    apiRequest<{ absences: Absence[] }>("/absences", { token }).then((res) => setAbsences(res.absences));
    apiRequest<{ grades: Grade[] }>("/grades", { token }).then((res) => setGrades(res.grades));
  }, [user?.classId]);

  if (!user?.classId) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-slate-100 text-center">
        <p className="text-slate-400">
          Vous n'êtes pas encore rattaché(e) à une classe. Contactez un administrateur.
        </p>
      </div>
    );
  }

  const average =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + (g.value / g.maxValue) * 20, 0) / grades.length).toFixed(1)
      : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-slate-100 space-y-8">
      <section>
        <h2 className="text-xl font-bold mb-3">Emploi du temps</h2>
        {schedule.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun créneau pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-800 bg-slate-800 rounded-lg overflow-hidden">
            {schedule.map((e) => (
              <li key={e.id} className="px-4 py-3 flex justify-between text-sm">
                <span>
                  <strong>{DAY_LABELS[e.dayOfWeek]}</strong> {e.startTime}–{e.endTime} · {e.subject.name}
                </span>
                <span className="text-slate-400">Salle {e.room}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">
          Notes {average && <span className="text-emerald-400 text-base font-normal">— moyenne : {average}/20</span>}
        </h2>
        {grades.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune note pour le moment.</p>
        ) : (
          <ul className="divide-y divide-slate-800 bg-slate-800 rounded-lg overflow-hidden">
            {grades.map((g) => (
              <li key={g.id} className="px-4 py-3 flex justify-between text-sm">
                <span>{g.subject.name}</span>
                <span className="font-semibold">{g.value}/{g.maxValue}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Absences</h2>
        {absences.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune absence enregistrée.</p>
        ) : (
          <ul className="divide-y divide-slate-800 bg-slate-800 rounded-lg overflow-hidden">
            {absences.map((a) => (
              <li key={a.id} className="px-4 py-3 flex justify-between text-sm">
                <span>{a.subject.name} — {new Date(a.date).toLocaleDateString("fr-FR")}</span>
                <span className={a.justified ? "text-emerald-400" : "text-red-400"}>
                  {a.justified ? "Justifiée" : "Non justifiée"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
