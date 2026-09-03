import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/"); // redirection vers le tableau de bord une fois connecté
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800 rounded-xl p-8 flex flex-col gap-4 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-center mb-2">Connexion</h1>

        {error && (
          <p className="bg-red-500/10 text-red-400 text-sm rounded-lg px-3 py-2">{error}</p>
        )}

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 mt-2 transition"
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-sm text-slate-400 text-center">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </form>
    </div>
  );
}
