import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface SchoolClass {
  id: string;
  name: string;
  year: number;
  _count: { students: number };
}

interface Subject {
  id: string;
  name: string;
  classId: string;
  teacher: { id: string; firstName: string; lastName: string } | null;
}

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  classId: string | null;
}

type Tab = "classes" | "subjects" | "users";

export default function AdminPanel() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("classes");

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  // Formulaires
  const [newClassName, setNewClassName] = useState("");
  const [newClassYear, setNewClassYear] = useState(new Date().getFullYear());
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectClassId, setNewSubjectClassId] = useState("");

  async function loadAll() {
    const [classesRes, subjectsRes, usersRes] = await Promise.all([
      apiRequest<{ classes: SchoolClass[] }>("/classes", { token }),
      apiRequest<{ subjects: Subject[] }>("/subjects", { token }),
      apiRequest<{ users: UserRow[] }>("/users", { token }),
    ]);
    setClasses(classesRes.classes);
    setSubjects(subjectsRes.subjects);
    setUsers(usersRes.users);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    await apiRequest("/classes", { method: "POST", token, body: { name: newClassName, year: newClassYear } });
    setNewClassName("");
    loadAll();
  }

  async function deleteClass(id: string) {
    if (!confirm("Supprimer cette classe et tout son contenu (matières, emploi du temps) ?")) return;
    await apiRequest(`/classes/${id}`, { method: "DELETE", token });
    loadAll();
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    await apiRequest("/subjects", { method: "POST", token, body: { name: newSubjectName, classId: newSubjectClassId } });
    setNewSubjectName("");
    loadAll();
  }

  async function assignTeacher(subjectId: string, teacherId: string) {
    await apiRequest(`/subjects/${subjectId}`, { method: "PUT", token, body: { teacherId: teacherId || null } });
    loadAll();
  }

  async function updateUser(userId: string, data: { role?: string; classId?: string | null }) {
    await apiRequest(`/users/${userId}`, { method: "PATCH", token, body: data });
    loadAll();
  }

  const teachers = users.filter((u) => u.role === "TEACHER");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-slate-100">
      <h2 className="text-2xl font-bold mb-4">Administration</h2>

      <div className="flex gap-2 mb-6">
        {(["classes", "subjects", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === t ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-300"
            }`}
          >
            {t === "classes" ? "Classes" : t === "subjects" ? "Matières" : "Utilisateurs"}
          </button>
        ))}
      </div>

      {tab === "classes" && (
        <div className="space-y-4">
          <form onSubmit={createClass} className="flex gap-2 bg-slate-800 p-4 rounded-lg">
            <input
              placeholder="Nom (ex: DEV-B3-A)"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            />
            <input
              type="number"
              required
              value={newClassYear}
              onChange={(e) => setNewClassYear(Number(e.target.value))}
              className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            />
            <button className="bg-emerald-500 text-slate-900 font-semibold px-4 rounded-lg">Ajouter</button>
          </form>

          <ul className="divide-y divide-slate-800">
            {classes.map((c) => (
              <li key={c.id} className="flex justify-between items-center py-3">
                <span>
                  <strong>{c.name}</strong> — promotion {c.year} · {c._count.students} étudiant(s)
                </span>
                <button onClick={() => deleteClass(c.id)} className="text-red-400 text-sm hover:underline">
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "subjects" && (
        <div className="space-y-4">
          <form onSubmit={createSubject} className="flex gap-2 bg-slate-800 p-4 rounded-lg">
            <input
              placeholder="Nom (ex: Développement Web)"
              required
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            />
            <select
              required
              value={newSubjectClassId}
              onChange={(e) => setNewSubjectClassId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
            >
              <option value="">Classe...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="bg-emerald-500 text-slate-900 font-semibold px-4 rounded-lg">Ajouter</button>
          </form>

          <ul className="divide-y divide-slate-800">
            {subjects.map((s) => (
              <li key={s.id} className="flex justify-between items-center py-3 gap-3">
                <span>{s.name}</span>
                <select
                  value={s.teacher?.id || ""}
                  onChange={(e) => assignTeacher(s.id, e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="">Aucun enseignant</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "users" && (
        <ul className="divide-y divide-slate-800">
          {users.map((u) => (
            <li key={u.id} className="flex justify-between items-center py-3 gap-3">
              <span>{u.firstName} {u.lastName} <span className="text-slate-500 text-sm">({u.email})</span></span>
              <div className="flex gap-2">
                <select
                  value={u.role}
                  onChange={(e) => updateUser(u.id, { role: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="TEACHER">TEACHER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                {u.role === "STUDENT" && (
                  <select
                    value={u.classId || ""}
                    onChange={(e) => updateUser(u.id, { classId: e.target.value || null })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                  >
                    <option value="">Aucune classe</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
