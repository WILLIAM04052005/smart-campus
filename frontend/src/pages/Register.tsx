import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
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
        <h1 className="text-2xl font-bold text-center mb-2">Créer un compte</h1>

        {error && (
          <p className="bg-red-500/10 text-red-400 text-sm rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Prénom
            <input
              required
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1">
            Nom
            <input
              required
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Mot de passe <span className="text-slate-500">(8 caractères min.)</span>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-semibold rounded-lg py-2 mt-2 transition"
        >
          {isSubmitting ? "Création..." : "Créer mon compte"}
        </button>

        <p className="text-sm text-slate-400 text-center">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Connectez-vous
          </Link>
        </p>
      </form>
    </div>
  );
}
