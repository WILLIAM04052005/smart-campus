import { useAuth } from "./context/AuthContext";
import AdminPanel from "./pages/AdminPanel";
import TeacherPanel from "./pages/TeacherPanel";
import StudentPanel from "./pages/StudentPanel";

// Le tableau de bord affiche un contenu différent selon le rôle de
// l'utilisateur connecté : c'est le principe même d'une interface
// "role-based" (courant dans les applications professionnelles).
function App() {
  const { user, logout } = useAuth();

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

      {user?.role === "ADMIN" && <AdminPanel />}
      {user?.role === "TEACHER" && <TeacherPanel />}
      {user?.role === "STUDENT" && <StudentPanel />}
    </div>
  );
}

export default App;
