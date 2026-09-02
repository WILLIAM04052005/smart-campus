import { useEffect, useState } from "react";

// URL de l'API backend. En dev, le backend tourne sur le port 4000.
const API_URL = "http://localhost:4000/api/health";

type ApiStatus = "loading" | "connected" | "error";

function App() {
  const [status, setStatus] = useState<ApiStatus>("loading");

  // Appel AJAX (fetch) au démarrage pour vérifier que le frontend
  // parle bien avec le backend et que le backend parle avec la DB.
  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Réponse non OK");
        return res.json();
      })
      .then(() => setStatus("connected"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-4xl font-bold">Smart Campus</h1>
      <p className="text-slate-400">Sprint 0 — vérification de la chaîne complète</p>

      <div
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          status === "connected"
            ? "bg-emerald-500/20 text-emerald-400"
            : status === "error"
            ? "bg-red-500/20 text-red-400"
            : "bg-slate-700 text-slate-300"
        }`}
      >
        {status === "loading" && "Connexion au backend..."}
        {status === "connected" && "✓ Frontend ↔ Backend ↔ Base de données OK"}
        {status === "error" && "✗ Backend injoignable — vérifie qu'il tourne sur le port 4000"}
      </div>
    </div>
  );
}

export default App;
