import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: { firstName: string; lastName: string; role: string };
  class: { name: string } | null;
}

export default function Announcements() {
  const { user, token } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scope, setScope] = useState<"global" | "class">("global");

  const canPost = user?.role === "TEACHER" || user?.role === "ADMIN";

  async function load() {
    const res = await apiRequest<{ announcements: Announcement[] }>("/announcements", { token });
    setAnnouncements(res.announcements);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Pour un enseignant, "class" cible automatiquement sa propre classe
    // côté serveur (vérifié via teacherTeachesClass). Ici on simplifie en
    // n'envoyant classId que si l'utilisateur choisit "class" ET qu'il a
    // une classe associée (cas étudiant non pertinent ici, donc pour un
    // enseignant sans classe explicite, on pourrait affiner plus tard).
    await apiRequest("/announcements", {
      method: "POST",
      token,
      body: { title, content, classId: scope === "class" ? user?.classId ?? null : null },
    });
    setTitle("");
    setContent("");
    load();
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-slate-100 space-y-6">
      <h2 className="text-xl font-bold">Annonces</h2>

      {canPost && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
          <input
            placeholder="Titre"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Contenu"
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
          />
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "global" | "class")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="global">Visible par tout le monde</option>
            <option value="class">Ma classe uniquement</option>
          </select>
          <button className="bg-emerald-500 text-slate-900 font-semibold rounded-lg py-2 text-sm">
            Publier
          </button>
        </form>
      )}

      <ul className="space-y-3">
        {announcements.length === 0 && <p className="text-slate-500 text-sm">Aucune annonce pour le moment.</p>}
        {announcements.map((a) => (
          <li key={a.id} className="bg-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold">{a.title}</h3>
              {a.class ? (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5">{a.class.name}</span>
              ) : (
                <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">Global</span>
              )}
            </div>
            <p className="text-sm text-slate-300">{a.content}</p>
            <p className="text-xs text-slate-500 mt-2">
              {a.author.firstName} {a.author.lastName} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
