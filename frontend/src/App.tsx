import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import AdminPanel from "./pages/AdminPanel";
import TeacherPanel from "./pages/TeacherPanel";
import StudentPanel from "./pages/StudentPanel";
import Announcements from "./pages/Announcements";
import ResourceBooking from "./pages/ResourceBooking";

type Tab = "dashboard" | "announcements" | "booking";

// Le tableau de bord affiche un contenu différent selon le rôle de
// l'utilisateur connecté ("dashboard"), plus deux sections communes à
// tous les rôles : annonces et réservation de ressources.
function App() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="font-bold">Smart Campus</p>
          <p className="text-xs text-slate-500">
            {user?.firstName} {user?.lastName} · {user?.role}
          </p>
        </div>
        <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400 transition">
          Se déconnecter
        </button>
      </header>

      <nav className="flex gap-2 px-4 py-3 border-b border-slate-800">
        {([
          ["dashboard", "Tableau de bord"],
          ["announcements", "Annonces"],
          ["booking", "Réservations"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === key ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "dashboard" && (
        <>
          {user?.role === "ADMIN" && <AdminPanel />}
          {user?.role === "TEACHER" && <TeacherPanel />}
          {user?.role === "STUDENT" && <StudentPanel />}
        </>
      )}
      {tab === "announcements" && <Announcements />}
      {tab === "booking" && <ResourceBooking />}
    </div>
  );
}

export default App;
