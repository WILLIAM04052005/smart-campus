import { useAuth } from "./context/AuthContext";

// Tableau de bord minimal : affiche le profil de l'utilisateur connecté
// et un bouton de déconnexion. Sera enrichi au fil des prochains sprints
// (emploi du temps, notes, absences...) avec un affichage différent
// selon le rôle (STUDENT / TEACHER / ADMIN).
function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Smart Campus</h1>
        <p className="text-slate-400">NextCampus — Tableau de bord</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm text-center">
        <p className="text-lg font-semibold">
          {user?.firstName} {user?.lastName}
        </p>
        <p className="text-slate-400 text-sm">{user?.email}</p>
        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
          {user?.role}
        </span>
      </div>

      <button
        onClick={logout}
        className="text-sm text-slate-400 hover:text-red-400 transition underline"
      >
        Se déconnecter
      </button>
    </div>
  );
}

export default App;
